import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/authAdmin.js';
import {
  activatePoll,
  createPoll,
  deactivatePoll,
  getActivePollWithResults,
  getPollResultsPublic,
  votePoll
} from '../services/pollService.js';

export const pollsRouter = Router();

pollsRouter.get(
  '/polls/active',
  asyncHandler(async (_req, res) => {
    const data = await getActivePollWithResults();
    return res.json({ success: true, data });
  })
);

pollsRouter.get(
  '/polls/:id/results',
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const data = await getPollResultsPublic(id);
    return res.json({ success: true, data });
  })
);

pollsRouter.post(
  '/polls/:id/vote',
  asyncHandler(async (req, res) => {
    const pollId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const voterKey = typeof req.body?.voterKey === 'string' ? req.body.voterKey : '';
    const selectedOption =
      typeof req.body?.selectedOption === 'string' ? req.body.selectedOption : '';
    const { results, totalVotes } = await votePoll({ pollId, voterKey, selectedOption });
    return res.json({
      success: true,
      data: { results, totalVotes }
    });
  })
);

pollsRouter.post(
  '/polls',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const question = typeof req.body?.question === 'string' ? req.body.question : '';
    const options = req.body?.options;
    const data = await createPoll({ question, options });
    return res.status(201).json({ success: true, data });
  })
);

pollsRouter.post(
  '/polls/:id/activate',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const data = await activatePoll(id);
    return res.json({ success: true, data });
  })
);

pollsRouter.post(
  '/polls/:id/deactivate',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const data = await deactivatePoll(id);
    return res.json({ success: true, data });
  })
);
