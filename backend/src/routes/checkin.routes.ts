import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/authAdmin.js';
import {
  checkInAttendeeByBadgeId,
  getAttendeeByBadgeId
} from '../services/registrationService.js';

export const checkinRouter = Router();

checkinRouter.get(
  '/attendees/:attendeeId',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const attendeeId =
      typeof req.params.attendeeId === 'string' ? req.params.attendeeId.trim() : '';
    if (!attendeeId) {
      return res.status(400).json({ success: false, message: 'Missing attendee id' });
    }
    const attendee = await getAttendeeByBadgeId(attendeeId);
    return res.json({ success: true, data: attendee });
  })
);

checkinRouter.post(
  '/checkin/:attendeeId',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const attendeeId =
      typeof req.params.attendeeId === 'string' ? req.params.attendeeId.trim() : '';
    if (!attendeeId) {
      return res.status(400).json({ success: false, message: 'Missing attendee id' });
    }
    const attendee = await checkInAttendeeByBadgeId(attendeeId);
    return res.json({
      success: true,
      data: {
        message: `${attendee.fullName} checked in successfully`,
        attendee
      }
    });
  })
);
