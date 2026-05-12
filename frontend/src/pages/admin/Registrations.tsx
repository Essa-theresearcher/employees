import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BadgePreview } from '../../components/BadgePreview';
import { apiGet, apiPatchJson, ApiError } from '../../lib/api';
import { resolveScreenshotUrl } from '../../lib/assetUrl';
import { downloadBadgePdf, downloadBadgePng } from '../../lib/badgeExport';
import { clearAdminToken, getAdminToken } from '../../lib/auth';
import { CONTRIBUTION_LABELS, PAYMENT_LABELS, SKILL_LABELS, STATUS_LABELS } from '../../lib/labels';

type BadgeDto = { badgeId: string; qrTargetUrl: string };
type RegistrationDto = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  contributionFocus: string;
  skillLevel: string;
  paymentMethod: string;
  mpesaTransactionCode: string | null;
  mpesaConfirmationMessage: string | null;
  screenshotPath: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  badge: BadgeDto | null;
};

type StatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'PENDING' || raw === 'VERIFIED' || raw === 'REJECTED') return raw;
  return 'ALL';
}

export function AdminRegistrations() {
  const navigate = useNavigate();
  const token = getAdminToken()!;
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const [searchParams] = useSearchParams();

  const [rows, setRows] = useState<RegistrationDto[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>(() => parseStatus(searchParams.get('status')));
  const [selected, setSelected] = useState<RegistrationDto | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'ALL') params.set('status', status);
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [q, status]);

  async function load() {
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: RegistrationDto[] }>(
        `/admin/registrations${queryString}`,
        token
      );
      setRows(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load registrations.');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    setNote(selected?.adminNote ?? '');
  }, [selected]);

  async function patch(action: 'approve' | 'reject') {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await apiPatchJson(
        `/admin/registrations/${selected.id}`,
        { action, adminNote: note.trim() || null },
        token
      );
      setSelected(null);
      setNote('');
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(kind: 'png' | 'pdf') {
    if (!badgeRef.current || !selected?.badge) return;
    try {
      if (kind === 'png') await downloadBadgePng(badgeRef.current, selected.badge.badgeId);
      else await downloadBadgePdf(badgeRef.current, selected.badge.badgeId);
    } catch {
      setError('Could not export badge. Try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Registrations</h1>
          <p className="mt-1 text-sm text-slate-600">Search, verify payments, and issue badges.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, email, M-Pesa code…"
          className="w-full flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:w-56"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-brand-50/40" onClick={() => setSelected(r)}>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.fullName}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{r.email}</div>
                  <div className="text-xs text-slate-500">{r.phone}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      r.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800'
                        : r.status === 'REJECTED'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.badge?.badgeId ?? '—'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  No registrations match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-900">{selected.fullName}</h2>
                <p className="text-sm text-slate-600">
                  {selected.email} · {selected.phone}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</p>
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Contribution</dt>
                      <dd className="font-semibold text-slate-900">
                        {CONTRIBUTION_LABELS[selected.contributionFocus] ?? selected.contributionFocus}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Skill level</dt>
                      <dd className="font-semibold text-slate-900">
                        {SKILL_LABELS[selected.skillLevel] ?? selected.skillLevel}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Payment method</dt>
                      <dd className="font-semibold text-slate-900">
                        {PAYMENT_LABELS[selected.paymentMethod] ?? selected.paymentMethod}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">M-Pesa details</p>
                  <p className="mt-2 font-mono text-sm text-slate-900">{selected.mpesaTransactionCode ?? '—'}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    {selected.mpesaConfirmationMessage ?? '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Screenshot</p>
                  {(() => {
                    const shot = resolveScreenshotUrl(selected.screenshotPath);
                    return shot ? (
                      <img
                        src={shot}
                        alt="Payment screenshot"
                        className="mt-3 max-h-72 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">No screenshot uploaded.</p>
                    );
                  })()}
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Admin note
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Optional note visible internally."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
                  />
                </label>

                {selected.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patch('approve')}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      Approve &amp; issue badge
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patch('reject')}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Badge preview</p>
                {selected.status === 'VERIFIED' && selected.badge ? (
                  <div className="space-y-3 overflow-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDownload('png')}
                        className="rounded-xl bg-brand-900 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Download PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownload('pdf')}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Download PDF
                      </button>
                    </div>
                    <BadgePreview
                      ref={badgeRef}
                      attendeeName={selected.fullName}
                      badgeId={selected.badge.badgeId}
                      contributionLabel={CONTRIBUTION_LABELS[selected.contributionFocus] ?? selected.contributionFocus}
                      qrValue={selected.badge.qrTargetUrl}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
                    Approve this registration to generate the attendee badge and QR verification link.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
