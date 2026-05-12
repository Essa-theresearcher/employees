/**
 * When `VITE_PUBLIC_EVENT_MODULES_OPEN_AT` is set to an ISO-8601 instant (e.g. 2026-05-15T08:00:00+03:00),
 * public routes for teams, leaderboard, judge, Q&A, polls, certificates, and /display/* redirect to `/levels`
 * until that time (see `PublicEventModuleGate`). When unset, modules stay open (preserves existing deployments).
 * Admins with a stored token bypass the gate for preview.
 */
export function isPublicEventModulesUnlocked(): boolean {
  const raw = (import.meta.env.VITE_PUBLIC_EVENT_MODULES_OPEN_AT as string | undefined)?.trim();
  if (!raw) return true;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return true;
  return Date.now() >= t;
}
