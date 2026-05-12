import { Link } from 'react-router-dom';
import { LeaderboardPage } from '../LeaderboardPage';

export function AdminLeaderboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Leaderboard</h1>
          <p className="text-sm text-slate-600">Read-only admin view of the live leaderboard.</p>
        </div>
        <Link
          to="/display/leaderboard"
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Open projector view
        </Link>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <LeaderboardPage />
      </div>
    </div>
  );
}
