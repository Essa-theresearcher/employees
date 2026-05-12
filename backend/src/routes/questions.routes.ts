import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/authAdmin.js';
import {
  createQuestion,
  deleteQuestion,
  listQuestions,
  markQuestionAnswered,
  upvoteQuestion
} from '../services/qaService.js';

export const questionsRouter = Router();

questionsRouter.get(
  '/questions',
  asyncHandler(async (_req, res) => {
    const data = await listQuestions();
    return res.json({ success: true, data });
  })
);

questionsRouter.post(
  '/questions',
  asyncHandler(async (req, res) => {
    const attendeeName =
      typeof req.body?.attendeeName === 'string' ? req.body.attendeeName : '';
    const questionText =
      typeof req.body?.questionText === 'string' ? req.body.questionText : '';
    const data = await createQuestion({ attendeeName, questionText });
    return res.status(201).json({ success: true, data });
  })
);

questionsRouter.post(
  '/questions/:id/upvote',
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const data = await upvoteQuestion(id);
    return res.json({ success: true, data });
  })
);

questionsRouter.post(
  '/questions/:id/answered',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const data = await markQuestionAnswered(id);
    return res.json({ success: true, data });
  })
);

questionsRouter.delete(
  '/questions/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await deleteQuestion(id);
    return res.json({ success: true });
  })
);
