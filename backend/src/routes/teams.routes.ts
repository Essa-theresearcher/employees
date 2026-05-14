import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { joinTeam, leaveTeam, listAvailableAttendees, listTeams } from '../services/teamService.js';

export const teamsRouter = Router();

teamsRouter.get(
  '/teams',
  asyncHandler(async (_req, res) => {
    const data = await listTeams();
    return res.json({ success: true, data });
  })
);

teamsRouter.post(
  '/teams/:teamId/join',
  asyncHandler(async (req, res) => {
    const teamId = typeof req.params.teamId === 'string' ? req.params.teamId.trim() : '';
    const attendeeId =
      typeof req.body?.attendeeId === 'string' ? req.body.attendeeId : '';
    const skills = typeof req.body?.skills === 'string' ? req.body.skills : null;
    const roleInTeam =
      typeof req.body?.roleInTeam === 'string' ? req.body.roleInTeam : null;

    const data = await joinTeam({ teamId, attendeeId, skills, roleInTeam });
    return res.json({
      success: true,
      data,
      message: 'Joined team successfully'
    });
  })
);

teamsRouter.post(
  '/teams/:teamId/leave',
  asyncHandler(async (req, res) => {
    const teamId = typeof req.params.teamId === 'string' ? req.params.teamId.trim() : '';
    const attendeeId =
      typeof req.body?.attendeeId === 'string' ? req.body.attendeeId : '';
    const data = await leaveTeam({ teamId, attendeeId });
    return res.json({
      success: true,
      data,
      message: 'Left team successfully'
    });
  })
);

teamsRouter.get(
  '/attendees/available',
  asyncHandler(async (_req, res) => {
    const data = await listAvailableAttendees();
    return res.json({ success: true, data });
  })
);
