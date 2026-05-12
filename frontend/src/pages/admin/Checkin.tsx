import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPostJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type CheckinMetrics = {
  totalRegistered: number;
  paymentApproved: number;
  checkedIn: number;
  notCheckedIn: number;
};

type AttendeeDto = {
  id: string;
  badgeId: string;
  fullName: string;
  phone: string;
  email: string;
  paymentStatus: 'pending' | 'approved' | 'rejected';
  checkedIn: boolean;
  checkedInAt: string | null;
};

const paymentLabels: Record<AttendeeDto['paymentStatus'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminCheckin() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [metrics, setMetrics] = useState<CheckinMetrics | null>(null);
  const [rows, setRows] = useState<AttendeeDto[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    | { kind: 'success'; text: string }
    | { kind: 'error'; text: string }
    | null
  >(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [q]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, list] = await Promise.all([
        apiGet<{ success: boolean; data: CheckinMetrics }>('/admin/checkin/metrics', token),
        apiGet<{ success: boolean; data: AttendeeDto[] }>(
          `/admin/checkin/attendees${queryString}`,
          token
        )
      ]);
      setMetrics(m.data);
      setRows(list.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load check-in data.');
    } finally {
      setLoading(false);
    }
  }, [navigate, queryString, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCheckin(row: AttendeeDto) {
    setFeedback(null);
    setBusyId(row.id);
    try {
      const res = await apiPostJson<{
        success: boolean;
        data: { message: string; attendee: AttendeeDto };
      }>(`/admin/checkin/attendees/${encodeURIComponent(row.badgeId)}`, {}, token);
      setFeedback({ kind: 'success', text: res.data.message });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAdminToken();
          navigate('/admin/login', { replace: true });
          return;
        }
        setFeedback({ kind: 'error', text: err.message });
      } else {
        setFeedback({ kind: 'error', text: 'Check-in failed.' });
      }
    } finally {
      setBusyId(null);
    }
  }

  const cards = metrics
    ? [
        { label: 'Total registered', value: metrics.totalRegistered },
        { label: 'Payment approved', value: metrics.paymentApproved },
        { label: 'Checked in', value: metrics.checkedIn },
        { label: 'Not checked in', value: metrics.notCheckedIn }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Event Check-In</h1>
          <p className="mt-1 text-sm text-slate-600">
            Scan badge QRs at the door or search and check attendees in manually.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-3 text-2xl font-bold text-brand-900">{c.value}</p>
          </div>
        ))}
        {loading && !metrics && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Loading metrics…
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.kind === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, email, or badge ID…"
          className="w-full flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
        />
        <p className="text-xs text-slate-500 sm:ml-3">Only approved attendees are listed.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Checked in</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.fullName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.badgeId}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {paymentLabels[r.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        r.checkedIn ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.checkedIn ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(r.checkedInAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.checkedIn ? (
                      <span className="text-xs font-semibold text-emerald-700">Already checked in</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleCheckin(r)}
                        disabled={busyId === r.id}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {busyId === r.id ? 'Checking…' : 'Check In'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No approved attendees match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 sm:hidden">
          {rows.map((r) => (
            <div key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.fullName}</p>
                  <p className="text-xs text-slate-500">{r.phone}</p>
                  <p className="font-mono text-xs text-slate-700">{r.badgeId}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    r.checkedIn ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r.checkedIn ? 'Checked in' : 'Not yet'}
                </span>
              </div>
              {r.checkedIn ? (
                <p className="text-xs text-slate-500">Time: {formatDateTime(r.checkedInAt)}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCheckin(r)}
                  disabled={busyId === r.id}
                  className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busyId === r.id ? 'Checking…' : 'Check In'}
                </button>
              )}
            </div>
          ))}
          {!rows.length && !loading && (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No approved attendees match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
