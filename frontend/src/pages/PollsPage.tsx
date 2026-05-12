import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet, apiPostJson, ApiError } from '../lib/api';

const REFRESH_MS = 5000;
const VOTER_STORE = 'coffee-code-poll-voter';

type PollDto = {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  totalVotes: number;
};

type ResultRow = { option: string; count: number; percent: number };

type ActivePayload = {
  poll: PollDto | null;
  results: ResultRow[];
};

function getOrCreateVoterKey(badgeFromUrl: string | null): string {
  const badge = badgeFromUrl?.trim();
  if (badge) return badge.slice(0, 200);
  try {
    let k = localStorage.getItem(VOTER_STORE);
    if (!k) {
      k = crypto.randomUUID();
      localStorage.setItem(VOTER_STORE, k);
    }
    return k;
  } catch {
    return `anon-${Date.now()}`;
  }
}

export function PollsPage() {
  const [searchParams] = useSearchParams();
  const badgeFromUrl = searchParams.get('badge');

  const voterKey = useMemo(
    () => getOrCreateVoterKey(badgeFromUrl),
    [badgeFromUrl]
  );

  const [payload, setPayload] = useState<ActivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const poll = payload?.poll;
  const results = payload?.results ?? [];

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: ActivePayload }>('/polls/active');
      setPayload(res.data);
      setError(null);
    } catch {
      setError('Could not load poll.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!poll) setVoted(false);
  }, [poll]);

  async function onVote(e: FormEvent) {
    e.preventDefault();
    if (!payload?.poll || !selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPostJson<{ success: boolean; data: { results: ResultRow[]; totalVotes: number } }>(
        `/polls/${encodeURIComponent(payload.poll.id)}/vote`,
        { voterKey, selectedOption: selected }
      );
      setVoted(true);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setVoted(true);
        setError(err.message);
      } else setError('Could not submit vote.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Attendee Portal</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Live poll</h1>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        {loading && <p className="text-center text-sm text-slate-600">Loading…</p>}

        {!loading && !poll && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-800">No active poll right now</p>
          </div>
        )}

        {poll && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-brand-900">{poll.question}</h2>
            <p className="mt-2 text-xs text-slate-500">
              {voted ? 'Your vote is recorded.' : 'Pick one option, then tap Vote.'}
            </p>

            {!voted ? (
              <form className="mt-6 space-y-4" onSubmit={onVote}>
                <div className="grid gap-2">
                  {poll.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelected(opt)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        selected === opt
                          ? 'border-brand-900 bg-brand-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!selected || submitting}
                  className="w-full rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Vote'}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-semibold text-slate-700">Results ({poll.totalVotes} votes)</p>
                {results.map((r) => (
                  <div key={r.option}>
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{r.option}</span>
                      <span>
                        {r.count} ({r.percent}%)
                      </span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-700 transition-all"
                        style={{ width: `${Math.min(100, r.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
