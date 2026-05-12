import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export type QuestionDto = {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
};

function toDto(q: {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: Date;
}): QuestionDto {
  return {
    id: q.id,
    attendeeName: q.attendeeName,
    questionText: q.questionText,
    upvotes: q.upvotes,
    isAnswered: q.isAnswered,
    createdAt: q.createdAt.toISOString()
  };
}

export async function listQuestions(): Promise<QuestionDto[]> {
  const rows = await prisma.question.findMany({
    orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }]
  });
  return rows.map(toDto);
}

export async function createQuestion(input: {
  attendeeName: string;
  questionText: string;
}): Promise<QuestionDto> {
  const attendeeName = input.attendeeName?.trim();
  const questionText = input.questionText?.trim();
  if (!attendeeName) throw new AppError('Name is required', 400);
  if (!questionText) throw new AppError('Question is required', 400);
  if (attendeeName.length > 120) throw new AppError('Name is too long', 400);
  if (questionText.length > 2000) throw new AppError('Question is too long', 400);

  const created = await prisma.question.create({
    data: { attendeeName, questionText }
  });
  return toDto(created);
}

export async function upvoteQuestion(id: string): Promise<QuestionDto> {
  const qid = id?.trim();
  if (!qid) throw new AppError('Invalid question', 400);
  try {
    const updated = await prisma.question.update({
      where: { id: qid },
      data: { upvotes: { increment: 1 } }
    });
    return toDto(updated);
  } catch {
    throw new AppError('Question not found', 404);
  }
}

export async function markQuestionAnswered(id: string): Promise<QuestionDto> {
  const qid = id?.trim();
  if (!qid) throw new AppError('Invalid question', 400);
  try {
    const updated = await prisma.question.update({
      where: { id: qid },
      data: { isAnswered: true }
    });
    return toDto(updated);
  } catch {
    throw new AppError('Question not found', 404);
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  const qid = id?.trim();
  if (!qid) throw new AppError('Invalid question', 400);
  try {
    await prisma.question.delete({ where: { id: qid } });
  } catch {
    throw new AppError('Question not found', 404);
  }
}

export type QaMetricsDto = {
  totalQuestions: number;
  unansweredQuestions: number;
  topQuestion: { id: string; questionText: string; upvotes: number; attendeeName: string } | null;
};

export async function getQaMetrics(): Promise<QaMetricsDto> {
  const [totalQuestions, unansweredQuestions, top] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { isAnswered: false } }),
    prisma.question.findFirst({
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, questionText: true, upvotes: true, attendeeName: true }
    })
  ]);

  return {
    totalQuestions,
    unansweredQuestions,
    topQuestion: top
      ? {
          id: top.id,
          questionText: top.questionText,
          upvotes: top.upvotes,
          attendeeName: top.attendeeName
        }
      : null
  };
}
