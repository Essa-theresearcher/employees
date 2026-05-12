import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

const JUDGE_NAME_KEY = 'coffee-code-judge-name';

export function JudgeLayout() {
  const [judgeName, setJudgeName] = useState<string>('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(JUDGE_NAME_KEY);
      if (saved) setJudgeName(saved);
    } catch {
      /* ignore */
    }
    function onStorage() {
      try {
        setJudgeName(localStorage.getItem(JUDGE_NAME_KEY) ?? '');
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 via-white to-coffee-50">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-brand-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Judge Panel
            </span>
            <span className="text-base font-bold text-brand-900">Coffee &amp; Code</span>
          </div>
          <div className="flex items-center gap-3">
            {judgeName ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Signed in as {judgeName}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Not signed in
              </span>
            )}
            <Link
              to="/leaderboard"
              className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 sm:inline-flex"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
