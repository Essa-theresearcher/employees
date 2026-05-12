import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

const REFRESH_MS = 5000;

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

export function PollsDisplayPage() {
  const [payload, setPayload] = useState<ActivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: ActivePayload }>('/polls/active');
      setPayload(res.data);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Lost connection. Retrying…');
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const poll = payload?.poll;
  const results = payload?.results ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-brand-900 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200/90">Coffee &amp; Code</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">Live Poll</h1>
          <p className="mt-3 text-lg text-white/60">Results update every {REFRESH_MS / 1000}s</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {!poll && (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-16 text-center text-2xl text-white/70">
            No active poll right now
          </div>
        )}

        {poll && (
          <div className="flex flex-1 flex-col gap-8">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{poll.question}</h2>
            <p className="text-xl text-white/60">{poll.totalVotes} total votes</p>
            <div className="space-y-6">
              {results.map((r) => (
                <div key={r.option}>
                  <div className="mb-2 flex justify-between text-lg font-semibold">
                    <span>{r.option}</span>
                    <span>
                      {r.count} · {r.percent}%
                    </span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-full bg-white/10 sm:h-8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-brand-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, r.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-auto text-xs uppercase tracking-[0.28em] text-white/35">
          {lastUpdated && <>Last updated {lastUpdated.toLocaleTimeString()}</>}
        </footer>
      </div>
    </div>
  );
}
