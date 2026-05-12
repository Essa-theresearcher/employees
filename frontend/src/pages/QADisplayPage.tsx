import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

type Question = {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
};

const REFRESH_MS = 5000;

export function QADisplayPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Question[] }>('/questions');
      setQuestions(res.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-brand-900 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200/90">Coffee &amp; Code</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">Live Q&amp;A</h1>
          <p className="mt-3 text-lg text-white/60">Top questions first · refreshes every {REFRESH_MS / 1000}s</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4">
          {questions.map((q) => (
            <article
              key={q.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-200/80">{q.attendeeName}</p>
                  <p className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">{q.questionText}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-lg font-bold">{q.upvotes}</span>
                  {q.isAnswered && (
                    <span className="rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Answered
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {questions.length === 0 && !error && (
            <p className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-xl text-white/60">
              No questions yet.
            </p>
          )}
        </div>

        <footer className="mt-auto text-xs uppercase tracking-[0.28em] text-white/35">
          {lastUpdated && <>Last updated {lastUpdated.toLocaleTimeString()}</>}
        </footer>
      </div>
    </div>
  );
}
