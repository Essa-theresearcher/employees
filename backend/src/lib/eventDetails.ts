export const CURRENT_EVENT_AMOUNT_KES = 2500;
export const CURRENT_EVENT_SCHEDULE_NOTE = '4th July';

const OLD_EVENT_AMOUNT_KES = 1000;
const OLD_EVENT_SCHEDULE_NOTE = 'Please arrive from 4:30 PM onward.';

export function normalizeEventAmountKes(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return CURRENT_EVENT_AMOUNT_KES;
  return amount === OLD_EVENT_AMOUNT_KES ? CURRENT_EVENT_AMOUNT_KES : amount;
}

export function normalizeEventScheduleNote(value: string | null | undefined): string {
  const note = value?.trim() ?? '';
  return !note || note === OLD_EVENT_SCHEDULE_NOTE ? CURRENT_EVENT_SCHEDULE_NOTE : note;
}
