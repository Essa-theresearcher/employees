import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePreview } from './BadgePreview';
import { apiGet, ApiError } from '../lib/api';
import { syncCheckedInEventAccessFromStatus } from '../lib/eventModules';
import { downloadBadgePdf, downloadBadgePng } from '../lib/badgeExport';
import { CONTRIBUTION_LABELS } from '../lib/labels';

type Props = {
  registrationId: string;
};

type StatusPayload = {
  id: string;
  fullName: string;
  contributionFocus: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminNote: string | null;
  checkedIn: boolean;
  badge: { badgeId: string; qrTargetUrl: string } | null;
};

export function AttendeePortal({ registrationId }: Props) {
  
  const badgeRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!registrationId) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await apiGet<{ success: boolean; data: StatusPayload }>(
          `/registrations/${encodeURIComponent(registrationId)}/status`
        );
        setData(res.data);
        syncCheckedInEventAccessFromStatus(res.data.id, Boolean(res.data.checkedIn));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('We could not find this registration. Please check your link.');
        } else {
          setError('Unable to load your registration right now. Please try again.');
        }
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [registrationId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data || data.status !== 'PENDING') return;
    const handle = window.setInterval(() => {
      void load(true);
    }, 15000);
    return () => window.clearInterval(handle);
  }, [data, load]);

  async function handleDownload(kind: 'png' | 'pdf') {
    if (!badgeRef.current || !data?.badge) return;
    setDownloadError(null);
    try {
      if (kind === 'png') await downloadBadgePng(badgeRef.current, data.badge.badgeId);
      else await downloadBadgePdf(badgeRef.current, data.badge.badgeId);
    } catch {
      setDownloadError('Could not export the badge. Please try again.');
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-brand-50 to-coffee-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 hover:text-brand-900"
          >
            ← Coffee &amp; Code
          </Link>
          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => void load(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh status'}
          </button>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-900">Your attendee page</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-900">Coffee &amp; Code</h2>
          <p className="mt-2 text-sm text-slate-600">
            Bookmark this page. After check-in at the door, open it once on this device to unlock teams, Q&amp;A, polls, and the leaderboard.
          </p>

          {loading && <p className="mt-8 text-sm text-slate-600">Loading your registration…</p>}

          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                  <p className="mt-1 text-lg font-semibold text-brand-900">{data.fullName}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Contribution</p>
                  <p className="mt-1 text-lg font-semibold text-brand-900">
                    {CONTRIBUTION_LABELS[data.contributionFocus] ?? data.contributionFocus}
                  </p>
                </div>
              </div>

              {data.status === 'PENDING' && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
                    <p className="text-sm font-semibold text-amber-900">Payment pending verification</p>
                  </div>
                  <p className="mt-2 text-sm text-amber-900/80">
                    An admin is reviewing your payment. This page refreshes automatically — your badge will appear here as
                    soon as you’re approved.
                  </p>
                </div>
              )}

              {data.status === 'REJECTED' && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-800">Registration rejected</p>
                  <p className="mt-2 text-sm text-red-700">
                    {data.adminNote?.trim()
                      ? data.adminNote
                      : 'We could not verify your payment. Please contact the organizers for assistance.'}
                  </p>
                </div>
              )}

              {data.checkedIn && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-sky-900">You&apos;re checked in — event levels unlocked</p>
                  <p className="mt-2 text-sm text-sky-900/90">
                    Teams, Q&amp;A, polls, and the leaderboard are available on this device.
                  </p>
                  <Link
                    to="/levels"
                    className="mt-4 inline-flex rounded-2xl bg-sky-900 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    Open progress map
                  </Link>
                </div>
              )}

              {data.status === 'VERIFIED' && data.badge && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-sm font-semibold text-emerald-800">You’re approved!</p>
                    <p className="mt-2 text-sm text-emerald-800/90">
                      Your attendee badge is ready. Download the PNG (or PDF) below and bring it to the event — either on
                      your phone or printed out.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleDownload('png')}
                      className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/15 hover:bg-brand-700"
                    >
                      Download badge (PNG)
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload('pdf')}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Download as PDF
                    </button>
                  </div>

                  {downloadError && (
                    <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {downloadError}
                    </p>
                  )}

                  <div className="overflow-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <BadgePreview
                      ref={badgeRef}
                      attendeeName={data.fullName}
                      badgeId={data.badge.badgeId}
                      contributionLabel={CONTRIBUTION_LABELS[data.contributionFocus] ?? data.contributionFocus}
                      qrValue={data.badge.qrTargetUrl}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
