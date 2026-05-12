import { prisma } from '../prisma.js';
import type { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new AppError('Options must be an array', 400);
  const opts = raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  if (opts.length < 2 || opts.length > 6) throw new AppError('Provide between 2 and 6 options', 400);
  const seen = new Set<string>();
  for (const o of opts) {
    const k = o.toLowerCase();
    if (seen.has(k)) throw new AppError('Duplicate options are not allowed', 400);
    seen.add(k);
    if (o.length > 200) throw new AppError('An option is too long', 400);
  }
  return opts;
}

function optionsFromJson(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === 'string');
}

export async function createPoll(input: { question: string; options: unknown }): Promise<PollDto> {
  const question = input.question?.trim();
  if (!question) throw new AppError('Poll question is required', 400);
  if (question.length > 500) throw new AppError('Poll question is too long', 400);
  const options = parseOptions(input.options);

  const created = await prisma.poll.create({
    data: {
      question,
      options: options as unknown as Prisma.InputJsonValue
    }
  });
  return toPollDto(created, 0);
}

export type PollDto = {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  totalVotes: number;
};

function toPollDto(
  row: { id: string; question: string; options: unknown; isActive: boolean; createdAt: Date },
  totalVotes: number
): PollDto {
  return {
    id: row.id,
    question: row.question,
    options: optionsFromJson(row.options),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    totalVotes
  };
}

export async function listPollsAdmin(): Promise<
  Array<PollDto & { results: Array<{ option: string; count: number; percent: number }> }>
> {
  const polls = await prisma.poll.findMany({ orderBy: { createdAt: 'desc' } });
  const out: Array<PollDto & { results: Array<{ option: string; count: number; percent: number }> }> = [];
  for (const p of polls) {
    const results = await getPollResultsInternal(p.id);
    out.push({ ...toPollDto(p, results.totalVotes), results: results.breakdown });
  }
  return out;
}

async function getPollResultsInternal(pollId: string): Promise<{
  totalVotes: number;
  breakdown: Array<{ option: string; count: number; percent: number }>;
}> {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw new AppError('Poll not found', 404);
  const opts = optionsFromJson(poll.options);
  const counts = await prisma.pollVote.groupBy({
    by: ['selectedOption'],
    where: { pollId },
    _count: { _all: true }
  });
  const map = new Map(counts.map((c) => [c.selectedOption, c._count._all]));
  let total = 0;
  for (const o of opts) total += map.get(o) ?? 0;
  const breakdown = opts.map((option) => {
    const count = map.get(option) ?? 0;
    const percent = total === 0 ? 0 : Math.round((count / total) * 1000) / 10;
    return { option, count, percent };
  });
  return { totalVotes: total, breakdown };
}

export async function activatePoll(pollId: string): Promise<PollDto> {
  const id = pollId?.trim();
  if (!id) throw new AppError('Invalid poll', 400);
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) throw new AppError('Poll not found', 404);

  await prisma.$transaction([
    prisma.poll.updateMany({
      data: { isActive: false },
      where: { id: { not: '' } }
    }),
    prisma.poll.update({ where: { id }, data: { isActive: true } })
  ]);

  const updated = await prisma.poll.findUniqueOrThrow({ where: { id } });
  const { totalVotes } = await getPollResultsInternal(id);
  return toPollDto(updated, totalVotes);
}

export async function deactivatePoll(pollId: string): Promise<PollDto> {
  const id = pollId?.trim();
  if (!id) throw new AppError('Invalid poll', 400);
  try {
    const updated = await prisma.poll.update({
      where: { id },
      data: { isActive: false }
    });
    const { totalVotes } = await getPollResultsInternal(id);
    return toPollDto(updated, totalVotes);
  } catch {
    throw new AppError('Poll not found', 404);
  }
}

export type ActivePollResponse = {
  poll: PollDto | null;
  results: Array<{ option: string; count: number; percent: number }>;
};

export async function getActivePollWithResults(): Promise<ActivePollResponse> {
  const active = await prisma.poll.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' }
  });
  if (!active) return { poll: null, results: [] };
  const { totalVotes, breakdown } = await getPollResultsInternal(active.id);
  return { poll: toPollDto(active, totalVotes), results: breakdown };
}

export async function votePoll(input: {
  pollId: string;
  voterKey: string;
  selectedOption: string;
}): Promise<{ results: Array<{ option: string; count: number; percent: number }>; totalVotes: number }> {
  const pollId = input.pollId?.trim();
  const voterKey = input.voterKey?.trim();
  const selectedOption = input.selectedOption?.trim();
  if (!pollId) throw new AppError('Invalid poll', 400);
  if (!voterKey || voterKey.length > 200) throw new AppError('voterKey is required', 400);
  if (!selectedOption) throw new AppError('selectedOption is required', 400);

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw new AppError('Poll not found', 404);
  if (!poll.isActive) throw new AppError('No active poll right now', 409);

  const opts = optionsFromJson(poll.options);
  if (!opts.includes(selectedOption)) throw new AppError('Invalid option', 400);

  try {
    await prisma.pollVote.create({
      data: { pollId, voterKey, selectedOption }
    });
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e && 'code' in e ? String((e as { code?: string }).code) : '';
    if (code === 'P2002') throw new AppError('You have already voted in this poll', 409);
    throw e;
  }

  const { totalVotes, breakdown } = await getPollResultsInternal(pollId);
  return { results: breakdown, totalVotes };
}

export async function getPollResultsPublic(pollId: string) {
  const id = pollId?.trim();
  if (!id) throw new AppError('Invalid poll', 400);
  const { totalVotes, breakdown } = await getPollResultsInternal(id);
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) throw new AppError('Poll not found', 404);
  return { poll: toPollDto(poll, totalVotes), results: breakdown };
}
