import { z } from 'zod';

export const patchRegistrationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().max(2000).optional().nullable()
});
