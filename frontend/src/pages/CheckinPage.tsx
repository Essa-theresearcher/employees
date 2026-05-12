import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPostJson, ApiError } from '../lib/api';
import { clearAdminToken, getAdminToken } from '../lib/auth';

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

export function CheckinPage() {
  const { attendeeId } = useParams();
  const navigate = useNavigate();
  const token = getAdminToken();

  const [attendee, setAttendee] = useState<AttendeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!attendeeId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: AttendeeDto }>(
        `/attendees/${encodeURIComponent(attendeeId)}`,
        token
      );
      setAttendee(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAdminToken();
          navigate('/admin/login', { replace: true, state: { from: `/checkin/${attendeeId}` } });
          return;
        }
        if (err.status === 404) setError('Attendee not found. Check the QR code or badge ID.');
        else setError(err.message);
      } else {
        setError('Unable to load attendee right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [attendeeId, navigate, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCheckIn() {
    if (!attendeeId || !token) return;
    setActionError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await apiPostJson<{
        success: boolean;
        data: { message: string; attendee: AttendeeDto };
      }>(`/checkin/${encodeURIComponent(attendeeId)}`, {}, token);
      setAttendee(res.data.attendee);
      setSuccess(res.data.message);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAdminToken();
          navigate('/admin/login', { replace: true, state: { from: `/checkin/${attendeeId}` } });
          return;
        }
        setActionError(err.message);
        await load();
      } else {
        setActionError('Check-in failed. Try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!attendeeId) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-16">
        <p className="mx-auto max-w-md text-center text-sm text-slate-600">Missing attendee id.</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Coffee &amp; Code</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-900">Admin sign-in required</h1>
          <p className="mt-3 text-sm text-slate-600">
            Check-in is restricted to event staff. Sign in to scan attendee <span className="font-mono">{attendeeId}</span>.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate('/admin/login', { state: { from: `/checkin/${attendeeId}` } })
            }
            className="mt-6 w-full rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to admin sign-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Coffee &amp; Code</p>
            <p className="text-sm font-semibold text-slate-900">Event check-in</p>
          </div>
          <nav className="flex gap-3 text-sm font-semibold">
            <Link to="/admin/dashboard" className="text-slate-700 hover:text-brand-800">
              Dashboard
            </Link>
            <Link to="/admin/checkin" className="text-slate-700 hover:text-brand-800">
              All attendees
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {loading && <p className="text-sm text-slate-600">Loading attendee…</p>}

          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && attendee && (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-500">Badge</p>
              <p className="font-mono text-lg font-semibold text-brand-900">{attendee.badgeId}</p>
              <h1 className="mt-2 text-3xl font-bold text-brand-900">{attendee.fullName}</h1>

              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
                  <dd className="mt-1 font-medium text-slate-900">{attendee.phone}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-1 break-all font-medium text-slate-900">{attendee.email}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Payment status</dt>
                  <dd
                    className={`mt-1 font-semibold ${
                      attendee.paymentStatus === 'approved'
                        ? 'text-emerald-700'
                        : attendee.paymentStatus === 'rejected'
                          ? 'text-red-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {paymentLabels[attendee.paymentStatus]}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Check-in status</dt>
                  <dd
                    className={`mt-1 font-semibold ${
                      attendee.checkedIn ? 'text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {attendee.checkedIn ? 'Checked in' : 'Not checked in'}
                  </dd>
                  {attendee.checkedIn && (
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(attendee.checkedInAt)}</p>
                  )}
                </div>
              </dl>

              <div className="mt-8">
                {attendee.paymentStatus !== 'approved' ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800">
                    Payment not approved
                  </div>
                ) : attendee.checkedIn ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
                    Already checked in
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Time: {formatDateTime(attendee.checkedInAt)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleCheckIn()}
                    disabled={busy}
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Checking in…' : 'Check In'}
                  </button>
                )}
              </div>

              {success && (
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                  <p className="font-semibold">{success}</p>
                  <p className="mt-1 text-xs text-emerald-800">Time: {formatDateTime(attendee.checkedInAt)}</p>
                </div>
              )}
              {actionError && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
