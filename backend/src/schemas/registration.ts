import { z } from 'zod';

export const contributionFocusSchema = z.enum([
  'FRONTEND_DEVELOPMENT',
  'BACKEND_DEVELOPMENT',
  'UI_UX_DESIGN',
  'DATA_RESEARCH',
  'PRESENTATION_PITCHING',
  'BUSINESS_STRATEGY',
  'CONTENT_SOCIAL_MEDIA',
  'PROJECT_MANAGEMENT',
  'BEGINNER_LEARNING',
  'OPEN_TO_ANY_ROLE'
]);

export const skillLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const paymentMethodSchema = z.enum(['MPESA', 'CASH', 'BANK']);

export const registrationBodySchema = z
  .object({
    fullName: z.string().min(2).max(120),
    phone: z.string().min(6).max(32),
    email: z.string().email(),
    contributionFocus: contributionFocusSchema,
    skillLevel: skillLevelSchema,
    paymentMethod: paymentMethodSchema,
    mpesaTransactionCode: z.string().max(64).optional().nullable(),
    mpesaConfirmationMessage: z.string().max(4000).optional().nullable(),
    agreementAccepted: z.preprocess(
      (val) => val === true || val === 'true' || val === 'on',
      z.boolean()
    )
  })
  .refine((data) => data.agreementAccepted === true, {
    message: 'You must confirm payment and badge verification terms.',
    path: ['agreementAccepted']
  });
