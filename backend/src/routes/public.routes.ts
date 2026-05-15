import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registrationBodySchema } from '../schemas/registration.js';
import { getEventPhase } from '../services/eventPhaseService.js';
import { createRegistration, verifyBadgePublic, buildBadgeQrTargetUrl } from '../services/registrationService.js';
import { uploadScreenshotMemory } from '../middleware/uploadMemory.js';
import { persistRegistrationScreenshot } from '../services/storageService.js';

export const publicRouter = Router();

publicRouter.get(
  '/event',
  asyncHandler(async (_req, res) => {
    const data = await getEventPhase();
    return res.json({ success: true, data });
  })
);

publicRouter.post(
  '/registrations',
  uploadScreenshotMemory.single('screenshot'),
  asyncHandler(async (req, res) => {
    const parsed = registrationBodySchema.parse(req.body);

    const screenshotPath = req.file ? await persistRegistrationScreenshot(req.file) : null;

    const registration = await createRegistration({
      fullName: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email,
      contributionFocus: parsed.contributionFocus,
      skillLevel: parsed.skillLevel,
      paymentMethod: parsed.paymentMethod,
      mpesaTransactionCode: parsed.mpesaTransactionCode,
      mpesaConfirmationMessage: parsed.mpesaConfirmationMessage,
      screenshotPath,
      agreementAccepted: parsed.agreementAccepted
    });

    return res.status(201).json({
      success: true,
      data: {
        id: registration.id,
        status: registration.status,
        message:
          'Registration received. Your payment is pending verification. Once approved, your badge will be sent or downloaded.'
      }
    });
  })
);

publicRouter.get(
  '/verify/:badgeId',
  asyncHandler(async (req, res) => {
    const raw = typeof req.params.badgeId === 'string' ? req.params.badgeId : req.params.badgeId?.[0];
    const badgeId = raw?.trim();
    if (!badgeId) return res.status(400).json({ success: false, message: 'Missing badge id' });

    const payload = await verifyBadgePublic(badgeId);
    return res.json({ success: true, data: payload });
  })
);

publicRouter.get(
  '/registrations/:id/status',
  asyncHandler(async (req, res) => {
    const raw = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
    const id = raw?.trim();
    if (!id) return res.status(400).json({ success: false, message: 'Missing registration id' });

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { badge: true }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      data: {
        id: registration.id,
        fullName: registration.fullName,
        contributionFocus: registration.contributionFocus,
        status: registration.status,
        adminNote: registration.adminNote,
        checkedIn: registration.checkedIn,
        badge: registration.badge
          ? {
              badgeId: registration.badge.badgeId,
              qrTargetUrl: buildBadgeQrTargetUrl(registration.id)
            }
          : null
      }
    });
  })
);
