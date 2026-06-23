const EVENT_UNLOCK_AT = new Date('2026-07-04T00:00:00+03:00').getTime();

export function isEventDayUnlocked(now = new Date()): boolean {
  return now.getTime() >= EVENT_UNLOCK_AT;
}
