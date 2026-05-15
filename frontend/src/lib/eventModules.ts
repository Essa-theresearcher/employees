/**
 * Public “event modules” (teams, Q&A, polls, leaderboard, certificates)
 * unlock in the browser after the attendee has been **checked in** and opens their
 * registration page once (`/register?id=…` — see `syncCheckedInEventAccessFromStatus`).
 *
 * Venue projector pages (`/projector`, `/display/*`) are **not** gated.
 * Admins with a stored token bypass the gate (`PublicEventModuleGate`).
 */

const CHECKED_IN_IDS_KEY = 'ccc_event_checked_in_registration_ids';
const LAST_REGISTRATION_ID_KEY = 'ccc_last_registration_id';

function storage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function safeReadIds(): string[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(CHECKED_IN_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

function safeWriteIds(ids: string[]): void {
  const store = storage();
  if (!store) return;
  try {
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) store.removeItem(CHECKED_IN_IDS_KEY);
    else store.setItem(CHECKED_IN_IDS_KEY, JSON.stringify(uniq));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Remember which registration this browser belongs to (for re-sync after refresh). */
export function rememberRegistrationId(registrationId: string): void {
  const id = registrationId.trim();
  if (!id) return;
  try {
    storage()?.setItem(LAST_REGISTRATION_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getRememberedRegistrationId(): string | null {
  try {
    const id = storage()?.getItem(LAST_REGISTRATION_ID_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

/** Call when `/registrations/:id/status` returns. */
export function syncCheckedInEventAccessFromStatus(registrationId: string, checkedIn: boolean): void {
  const id = registrationId.trim();
  if (!id) return;
  rememberRegistrationId(id);
  const ids = new Set(safeReadIds());
  if (checkedIn) ids.add(id);
  else ids.delete(id);
  safeWriteIds([...ids]);
}

export function isPublicEventModulesUnlocked(): boolean {
  return safeReadIds().length > 0;
}

/** Re-fetch check-in status for the last registration on this device. */
export async function refreshEventAccessFromServer(
  fetchCheckedIn: (registrationId: string) => Promise<boolean>
): Promise<boolean> {
  if (isPublicEventModulesUnlocked()) return true;
  const id = getRememberedRegistrationId();
  if (!id) return false;
  try {
    const checkedIn = await fetchCheckedIn(id);
    syncCheckedInEventAccessFromStatus(id, checkedIn);
    return checkedIn;
  } catch {
    return false;
  }
}
