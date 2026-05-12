import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createScore, getLeaderboard, listScores } from '../services/scoreService.js';

export const scoresRouter = Router();

scoresRouter.get(
  '/scores',
  asyncHandler(async (_req, res) => {
    const data = await listScores();
    return res.json({ success: true, data });
  })
);

scoresRouter.post(
  '/scores',
  asyncHandler(async (req, res) => {
    const data = await createScore({
      teamId: typeof req.body?.teamId === 'string' ? req.body.teamId : '',
      judgeName: typeof req.body?.judgeName === 'string' ? req.body.judgeName : '',
      ideaClarityScore: req.body?.ideaClarityScore,
      technicalExecutionScore: req.body?.technicalExecutionScore,
      businessValueScore: req.body?.businessValueScore,
      presentationScore: req.body?.presentationScore,
      teamworkScore: req.body?.teamworkScore,
      comments: req.body?.comments
    });
    return res.status(201).json({
      success: true,
      data,
      message: 'Score submitted successfully'
    });
  })
);

scoresRouter.get(
  '/leaderboard',
  asyncHandler(async (_req, res) => {
    const data = await getLeaderboard();
    return res.json({ success: true, data });
  })
);
