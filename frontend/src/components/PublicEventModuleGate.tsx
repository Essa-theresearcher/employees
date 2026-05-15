import { Outlet } from 'react-router-dom';

/**
 * Event modules (teams, Q&A, polls, leaderboard) are gated only by EventPortalGate
 * (splash until teams are published). No per-attendee check-in lock.
 */
export function PublicEventModuleGate() {
  return <Outlet />;
}
