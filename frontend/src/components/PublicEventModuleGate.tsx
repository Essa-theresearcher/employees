import { Link, Outlet } from 'react-router-dom';
import { getAdminToken } from '../lib/auth';
import { EVENT_UNLOCK_LABEL, useEventDayUnlock } from '../lib/eventDay';

/**
 * Event modules (teams, Q&A, polls, leaderboard) are gated by EventPortalGate
 * and by the public event-day unlock. Admins can still open them for setup.
 */
export function PublicEventModuleGate() {
  const eventDayUnlocked = useEventDayUnlock();

  if (eventDayUnlocked || getAdminToken()) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Event Levels</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-900">Locked until {EVENT_UNLOCK_LABEL}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Teams, live Q&amp;A, polls, the leaderboard, and certificates will open on the event day. Registration remains
        available now.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/register"
          className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Register
        </Link>
        <Link
          to="/levels"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          View levels
        </Link>
      </div>
    </div>
  );
}
