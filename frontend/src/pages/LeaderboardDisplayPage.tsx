import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import type { LeaderboardRow } from './LeaderboardPage';

const REFRESH_MS = 5000;

type EventDto = {
  eventName: string;
};

export function LeaderboardDisplayPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [eventName, setEventName] = useState('Coffee & Code');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [lb, ev] = await Promise.all([
        apiGet<{ success: boolean; data: LeaderboardRow[] }>('/leaderboard'),
        apiGet<{ success: boolean; data: EventDto }>('/event').catch(() => null)
      ]);
      setRows(lb.data);
      if (ev?.data?.eventName) setEventName(ev.data.eventName);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Lost connection to the API. Retrying…');
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const hasAnyScores = rows.some((r) => r.totalJudges > 0);
  const scoredOrdered = rows.filter((r) => r.totalJudges > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-brand-900 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200/90">{eventName}</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">Live Hackathon Leaderboard</h1>
          <p className="mt-3 text-lg text-white/60">Auto-refresh every {REFRESH_MS / 1000}s</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {!hasAnyScores && rows.length > 0 && (
          <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-center text-xl text-white/70">
            No scores submitted yet
          </div>
        )}

        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const isTop =
              r.totalJudges > 0 && scoredOrdered.slice(0, 3).some((s) => s.teamId === r.teamId);
            const medal =
              isTop && r.totalJudges > 0
                ? scoredOrdered.findIndex((s) => s.teamId === r.teamId)
                : -1;
            return (
              <article
                key={r.teamId}
                className={`flex flex-col gap-3 rounded-3xl border p-5 shadow-2xl backdrop-blur sm:p-6 ${
                  isTop
                    ? 'border-amber-300/50 bg-gradient-to-b from-amber-500/25 to-white/10 ring-2 ring-amber-400/40'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${
                        medal === 0
                          ? 'bg-amber-400 text-slate-900'
                          : medal === 1
                            ? 'bg-slate-300 text-slate-900'
                            : medal === 2
                              ? 'bg-amber-800 text-amber-100'
                              : 'bg-white/15 text-white'
                      }`}
                    >
                      {r.rank}
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{r.teamName}</h2>
                      <p className="mt-1 text-sm text-white/55">
                        {r.memberCount} member{r.memberCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Avg</p>
                    <p className="text-3xl font-bold text-white">{r.averageScore.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Judges</p>
                    <p className="text-3xl font-bold text-white">{r.totalJudges}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="mt-auto text-xs uppercase tracking-[0.28em] text-white/35">
          {lastUpdated && <>Last updated {lastUpdated.toLocaleTimeString()}</>}
        </footer>
      </div>
    </div>
  );
}
