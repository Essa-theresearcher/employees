import { Router } from 'express';
import { z } from 'zod';
import type { RegistrationStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/authAdmin.js';
import { loginAdmin } from '../services/adminAuthService.js';
import { getDashboardMetrics } from '../services/metricsService.js';
import {
  approveRegistration,
  checkInAttendeeByBadgeId,
  getAttendeeByBadgeId,
  getCheckinMetrics,
  getRegistration,
  listCheckinAttendees,
  listRegistrations,
  rejectRegistration
} from '../services/registrationService.js';
import {
  createTeam,
  deleteEmptyTeam,
  getTeamMetrics,
  listTeams,
  removeMemberAsAdmin
} from '../services/teamService.js';
import { getJudgingMetrics, listScores } from '../services/scoreService.js';
import { getQaMetrics, listQuestions } from '../services/qaService.js';
import { listPollsAdmin } from '../services/pollService.js';
import { patchRegistrationSchema } from '../schemas/adminRegistration.js';
import { updateEventSchema } from '../schemas/event.js';
import { getEventPhase, setCheckInClosed } from '../services/eventPhaseService.js';

const registrationStatusSchema = z.enum(['PENDING', 'VERIFIED', 'REJECTED']);

export const adminRouter = Router();

adminRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(req.body);
    const result = await loginAdmin(body.email, body.password);
    return res.json({ success: true, data: result });
  })
);

adminRouter.use(requireAdmin);

adminRouter.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    const data = await getDashboardMetrics();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/registrations',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const parsedStatus = statusRaw ? registrationStatusSchema.safeParse(statusRaw) : null;
    const status: RegistrationStatus | undefined = parsedStatus?.success ? parsedStatus.data : undefined;

    const rows = await listRegistrations({ q, status });
    return res.json({ success: true, data: rows });
  })
);

adminRouter.get(
  '/registrations/:id',
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? '';
    const row = await getRegistration(id);
    return res.json({ success: true, data: row });
  })
);

adminRouter.patch(
  '/registrations/:id',
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    const body = patchRegistrationSchema.parse(req.body);
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? '';

    if (body.action === 'approve') {
      const row = await approveRegistration(id, admin.id, body.adminNote);
      return res.json({ success: true, data: row });
    }

    const row = await rejectRegistration(id, admin.id, body.adminNote);
    return res.json({ success: true, data: row });
  })
);

adminRouter.get(
  '/checkin/metrics',
  asyncHandler(async (_req, res) => {
    const data = await getCheckinMetrics();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/checkin/attendees',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await listCheckinAttendees(q);
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/checkin/attendees/:attendeeId',
  asyncHandler(async (req, res) => {
    const attendeeId =
      typeof req.params.attendeeId === 'string' ? req.params.attendeeId.trim() : '';
    const data = await getAttendeeByBadgeId(attendeeId);
    return res.json({ success: true, data });
  })
);

adminRouter.post(
  '/checkin/attendees/:attendeeId',
  asyncHandler(async (req, res) => {
    const attendeeId =
      typeof req.params.attendeeId === 'string' ? req.params.attendeeId.trim() : '';
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

adminRouter.get(
  '/teams/metrics',
  asyncHandler(async (_req, res) => {
    const data = await getTeamMetrics();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/teams',
  asyncHandler(async (_req, res) => {
    const data = await listTeams();
    return res.json({ success: true, data });
  })
);

adminRouter.post(
  '/teams',
  asyncHandler(async (req, res) => {
    const teamName = typeof req.body?.teamName === 'string' ? req.body.teamName : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description : null;
    const data = await createTeam({ teamName, description });
    return res
      .status(201)
      .json({ success: true, data, message: 'Team created successfully' });
  })
);

adminRouter.delete(
  '/teams/:teamId',
  asyncHandler(async (req, res) => {
    const teamId = typeof req.params.teamId === 'string' ? req.params.teamId.trim() : '';
    await deleteEmptyTeam(teamId);
    return res.json({ success: true });
  })
);

adminRouter.delete(
  '/teams/members/:memberId',
  asyncHandler(async (req, res) => {
    const memberId =
      typeof req.params.memberId === 'string' ? req.params.memberId.trim() : '';
    await removeMemberAsAdmin(memberId);
    return res.json({ success: true });
  })
);

adminRouter.get(
  '/judging/metrics',
  asyncHandler(async (_req, res) => {
    const data = await getJudgingMetrics();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/judging/scores',
  asyncHandler(async (_req, res) => {
    const data = await listScores();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/qa/metrics',
  asyncHandler(async (_req, res) => {
    const data = await getQaMetrics();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/qa/questions',
  asyncHandler(async (_req, res) => {
    const data = await listQuestions();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/polls',
  asyncHandler(async (_req, res) => {
    const data = await listPollsAdmin();
    return res.json({ success: true, data });
  })
);

adminRouter.get(
  '/event',
  asyncHandler(async (_req, res) => {
    const data = await getEventPhase();
    return res.json({ success: true, data });
  })
);

adminRouter.patch(
  '/event/check-in',
  asyncHandler(async (req, res) => {
    const closed = req.body?.closed === true;
    const data = await setCheckInClosed(closed);
    return res.json({
      success: true,
      data,
      message: closed ? 'Check-in closed. Attendees will see the portal when teams are published.' : 'Check-in reopened.'
    });
  })
);

adminRouter.patch(
  '/event',
  asyncHandler(async (req, res) => {
    const body = updateEventSchema.parse(req.body);
    const event = await prisma.eventSettings.update({
      where: { singletonKey: 1 },
      data: {
        ...(body.eventName !== undefined ? { eventName: body.eventName } : {}),
        ...(body.amountKes !== undefined ? { amountKes: body.amountKes } : {}),
        ...(body.mpesaChannelLabel !== undefined ? { mpesaChannelLabel: body.mpesaChannelLabel } : {}),
        ...(body.mpesaTillOrPaybill !== undefined ? { mpesaTillOrPaybill: body.mpesaTillOrPaybill } : {}),
        ...(body.accountReferenceHint !== undefined ? { accountReferenceHint: body.accountReferenceHint } : {}),
        ...(body.scheduleNote !== undefined ? { scheduleNote: body.scheduleNote } : {})
      }
    });
    const data = await getEventPhase();
    return res.json({ success: true, data });
  })
);
