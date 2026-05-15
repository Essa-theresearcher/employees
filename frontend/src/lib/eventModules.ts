/**
 * Public “event modules” (teams, Q&A, polls, leaderboard, certificates)
 * unlock in the browser after the attendee has been **checked in** and opens their
 * registration status page once (`/status/:id` — see `syncCheckedInEventAccessFromStatus`).
 *
 * Venue projector pages (`/projector`, `/display/*`) are **not** gated — use a separate
 * browser profile from admin so the hall screen never shows `/admin/*`.
 *
 * Admins with a stored token bypass the gate (`PublicEventModuleGate`).
 *
 * `VITE_PUBLIC_EVENT_MODULES_OPEN_AT` is no longer used for unlocking (check-in only).
 */

const STORAGE_KEY = 'ccc_event_checked_in_registration_ids';

function safeReadIds(): string[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

function safeWriteIds(ids: string[]): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(uniq));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Call from StatusPage when `/registrations/:id/status` returns. */
export function syncCheckedInEventAccessFromStatus(registrationId: string, checkedIn: boolean): void {
  const ids = new Set(safeReadIds());
  if (checkedIn) ids.add(registrationId);
  else ids.delete(registrationId);
  safeWriteIds([...ids]);
}

export function isPublicEventModulesUnlocked(): boolean {
  return safeReadIds().length > 0;
}
