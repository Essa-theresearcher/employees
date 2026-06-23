import { useEffect, useState } from 'react';

export const EVENT_UNLOCK_LABEL = '4 July 2026';
const EVENT_UNLOCK_AT = new Date('2026-07-04T00:00:00+03:00').getTime();

export function isEventDayUnlocked(now = new Date()): boolean {
  return now.getTime() >= EVENT_UNLOCK_AT;
}

export function useEventDayUnlock(): boolean {
  const [unlocked, setUnlocked] = useState(() => isEventDayUnlocked());

  useEffect(() => {
    if (unlocked) return;

    const tick = () => setUnlocked(isEventDayUnlocked());
    const delay = Math.max(1_000, Math.min(EVENT_UNLOCK_AT - Date.now(), 60_000));
    const id = window.setTimeout(tick, delay);

    return () => window.clearTimeout(id);
  }, [unlocked]);

  return unlocked;
}
