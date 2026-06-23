import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { previousCoffeeCodeWinners } from '../lib/previousWinners';

const REFRESH_MS = 5000;

export type LeaderboardRow = {
  rank: number;
  teamId: string;
  teamName: string;
  memberCount: number;
  averageScore: number;
  totalJudges: number;
  totalScore: number;
};

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setError(null);
      setLoading(true);
    }
    try {
      const res = await apiGet<{ success: boolean; data: LeaderboardRow[] }>('/leaderboard');
      setRows(res.data);
      setLastUpdated(new Date());
    } catch {
      setError('Could not load leaderboard.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const hasAnyScores = rows.some((r) => r.totalJudges > 0);

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Attendee Portal</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Live leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">Refreshes every {REFRESH_MS / 1000} seconds</p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && <p className="mb-4 text-center text-sm text-slate-600">Loading…</p>}

        {!loading && rows.length === 0 && !error && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
            No teams available yet
          </div>
        )}

        {!hasAnyScores && rows.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No scores submitted yet
          </div>
        )}

        {(rows.length > 0 || (loading && rows.length === 0)) && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div
                key={r.teamId}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                    {r.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{r.teamName}</p>
                    <p className="text-xs text-slate-500">
                      {r.memberCount} member{r.memberCount === 1 ? '' : 's'} · {r.totalJudges} judge
                      {r.totalJudges === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-baseline gap-6 pl-14 sm:pl-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-slate-500">Avg score</p>
                    <p className="text-lg font-bold text-brand-900">{r.averageScore.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-700">{r.totalScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {lastUpdated && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Last Coffee &amp; Code</p>
            <h2 className="mt-1 text-lg font-bold text-brand-900">Previous winning teams</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {previousCoffeeCodeWinners.map((winner) => (
              <div
                key={winner.rank}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                    {winner.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{winner.teamName}</p>
                    <p className="text-xs text-slate-500">
                      {winner.memberCount} members · {winner.totalJudges} judges
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-baseline gap-6 pl-14 sm:pl-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-slate-500">Avg score</p>
                    <p className="text-lg font-bold text-brand-900">{winner.averageScore.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-700">{winner.totalScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
