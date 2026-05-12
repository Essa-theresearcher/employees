import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { CONTRIBUTION_LABELS } from '../lib/labels';

type VerifyPayload =
  | {
      valid: true;
      badgeId: string;
      name: string;
      eventName: string;
      status: 'Verified';
      contributionFocus: string;
    }
  | {
      valid: false;
      badgeId: string;
      status: 'Invalid';
      eventName: string;
    };

export function VerifyPage() {
  const { badgeId } = useParams();
  const [data, setData] = useState<VerifyPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!badgeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiGet<{ success: boolean; data: VerifyPayload }>(
          `/verify/${encodeURIComponent(badgeId)}`
        );
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [badgeId]);

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-brand-50 to-coffee-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-brand-100 bg-white p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Coffee &amp; Code</p>
        <h1 className="mt-3 text-3xl font-bold text-brand-900">Badge verification</h1>
        <p className="mt-2 text-sm text-slate-600">Public lookup for issued attendee badges.</p>

        {loading && <p className="mt-8 text-sm text-slate-600">Checking badge…</p>}

        {!loading && !data && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to verify right now. Please try again later.
          </div>
        )}

        {!loading && data && (
          <dl className="mt-8 space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Badge ID</dt>
              <dd className="font-semibold text-brand-900">{data.badgeId}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Event</dt>
              <dd className="font-semibold text-brand-900">{data.eventName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Status</dt>
              <dd
                className={`font-semibold ${data.valid ? 'text-emerald-700' : 'text-red-700'}`}
              >
                {data.valid ? data.status : 'Invalid'}
              </dd>
            </div>
            {data.valid && (
              <>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-semibold text-slate-900">{data.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Contribution</dt>
                  <dd className="font-semibold text-slate-900">
                    {CONTRIBUTION_LABELS[data.contributionFocus] ?? data.contributionFocus}
                  </dd>
                </div>
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
