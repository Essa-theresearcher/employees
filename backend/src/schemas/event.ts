import { z } from 'zod';

export const updateEventSchema = z.object({
  eventName: z.string().min(3).max(120).optional(),
  amountKes: z.coerce.number().positive().max(1_000_000).optional(),
  mpesaChannelLabel: z.string().min(2).max(120).optional(),
  mpesaTillOrPaybill: z.string().min(2).max(120).optional(),
  accountReferenceHint: z.string().min(2).max(240).optional(),
  scheduleNote: z.string().max(500).optional()
});
