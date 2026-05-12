import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

const MIN = 1;
const MAX = 10;

function parseScore1to10(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < MIN || n > MAX) {
    throw new AppError('Score must be between 1 and 10', 400);
  }
  return n;
}

export function computeTotalScore(input: {
  ideaClarityScore: number;
  technicalExecutionScore: number;
  businessValueScore: number;
  presentationScore: number;
  teamworkScore: number;
}): number {
  return (
    input.ideaClarityScore +
    input.technicalExecutionScore +
    input.businessValueScore +
    input.presentationScore +
    input.teamworkScore
  );
}

export type ScoreDto = {
  id: string;
  teamId: string;
  teamName: string;
  judgeName: string;
  ideaClarityScore: number;
  technicalExecutionScore: number;
  businessValueScore: number;
  presentationScore: number;
  teamworkScore: number;
  totalScore: number;
  comments: string | null;
  createdAt: string;
};

function toScoreDto(row: {
  id: string;
  teamId: string;
  judgeName: string;
  ideaClarityScore: number;
  technicalExecutionScore: number;
  businessValueScore: number;
  presentationScore: number;
  teamworkScore: number;
  totalScore: number;
  comments: string | null;
  createdAt: Date;
  team: { teamName: string };
}): ScoreDto {
  return {
    id: row.id,
    teamId: row.teamId,
    teamName: row.team.teamName,
    judgeName: row.judgeName,
    ideaClarityScore: row.ideaClarityScore,
    technicalExecutionScore: row.technicalExecutionScore,
    businessValueScore: row.businessValueScore,
    presentationScore: row.presentationScore,
    teamworkScore: row.teamworkScore,
    totalScore: row.totalScore,
    comments: row.comments,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listScores(): Promise<ScoreDto[]> {
  const rows = await prisma.score.findMany({
    orderBy: { createdAt: 'desc' },
    include: { team: { select: { teamName: true } } }
  });
  return rows.map(toScoreDto);
}

export async function createScore(input: {
  teamId: string;
  judgeName: string;
  ideaClarityScore: unknown;
  technicalExecutionScore: unknown;
  businessValueScore: unknown;
  presentationScore: unknown;
  teamworkScore: unknown;
  comments?: string | null;
}): Promise<ScoreDto> {
  const teamId = input.teamId?.trim();
  if (!teamId) throw new AppError('Please select a team', 400);

  const judgeName = input.judgeName?.trim();
  if (!judgeName) throw new AppError('Judge name is required', 400);

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError('Please select a team', 400);

  const ideaClarityScore = parseScore1to10(input.ideaClarityScore);
  const technicalExecutionScore = parseScore1to10(input.technicalExecutionScore);
  const businessValueScore = parseScore1to10(input.businessValueScore);
  const presentationScore = parseScore1to10(input.presentationScore);
  const teamworkScore = parseScore1to10(input.teamworkScore);

  const existing = await prisma.score.findFirst({
    where: {
      teamId,
      judgeName: { equals: judgeName, mode: 'insensitive' }
    }
  });
  if (existing) throw new AppError('This judge has already scored this team', 409);

  const totalScore = computeTotalScore({
    ideaClarityScore,
    technicalExecutionScore,
    businessValueScore,
    presentationScore,
    teamworkScore
  });

  const comments =
    typeof input.comments === 'string' && input.comments.trim()
      ? input.comments.trim().slice(0, 2000)
      : null;

  try {
    const created = await prisma.score.create({
      data: {
        teamId,
        judgeName,
        ideaClarityScore,
        technicalExecutionScore,
        businessValueScore,
        presentationScore,
        teamworkScore,
        totalScore,
        comments
      },
      include: { team: { select: { teamName: true } } }
    });
    return toScoreDto(created);
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e && 'code' in e ? String((e as { code?: string }).code) : '';
    if (code === 'P2002') {
      throw new AppError('This judge has already scored this team', 409);
    }
    throw e;
  }
}

export type LeaderboardRowDto = {
  rank: number;
  teamId: string;
  teamName: string;
  memberCount: number;
  averageScore: number;
  totalJudges: number;
  totalScore: number;
};

export async function getLeaderboard(): Promise<LeaderboardRowDto[]> {
  const teams = await prisma.team.findMany({
    orderBy: { teamName: 'asc' },
    include: { _count: { select: { members: true } } }
  });

  const aggregates = await prisma.score.groupBy({
    by: ['teamId'],
    _avg: { totalScore: true },
    _sum: { totalScore: true },
    _count: { _all: true }
  });

  const byTeam = new Map(
    aggregates.map((a) => [
      a.teamId,
      {
        averageScore: a._avg.totalScore ?? 0,
        totalScore: a._sum.totalScore ?? 0,
        totalJudges: a._count._all
      }
    ])
  );

  type Row = {
    teamId: string;
    teamName: string;
    memberCount: number;
    averageScore: number;
    totalJudges: number;
    totalScore: number;
    hasScores: boolean;
  };

  const rows: Row[] = teams.map((t) => {
    const agg = byTeam.get(t.id);
    const hasScores = !!agg && agg.totalJudges > 0;
    return {
      teamId: t.id,
      teamName: t.teamName,
      memberCount: t._count.members,
      averageScore: hasScores ? Number(agg!.averageScore) : 0,
      totalJudges: agg?.totalJudges ?? 0,
      totalScore: agg?.totalScore ?? 0,
      hasScores
    };
  });

  const scored = rows.filter((r) => r.hasScores).sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.totalJudges !== a.totalJudges) return b.totalJudges - a.totalJudges;
    return a.teamName.localeCompare(b.teamName);
  });

  const unscored = rows.filter((r) => !r.hasScores).sort((a, b) => a.teamName.localeCompare(b.teamName));

  const ordered = [...scored, ...unscored];

  return ordered.map((r, i) => ({
    rank: i + 1,
    teamId: r.teamId,
    teamName: r.teamName,
    memberCount: r.memberCount,
    averageScore: Math.round(r.averageScore * 100) / 100,
    totalJudges: r.totalJudges,
    totalScore: r.totalScore
  }));
}

export type JudgingMetricsDto = {
  totalTeams: number;
  totalScoresSubmitted: number;
  averageEventScore: number | null;
  highestScoringTeam: { teamName: string; averageScore: number } | null;
};

export async function getJudgingMetrics(): Promise<JudgingMetricsDto> {
  const [totalTeams, totalScoresSubmitted, allScores, withSum] = await Promise.all([
    prisma.team.count(),
    prisma.score.count(),
    prisma.score.findMany({ select: { totalScore: true } }),
    prisma.score.groupBy({
      by: ['teamId'],
      _avg: { totalScore: true },
      _sum: { totalScore: true },
      _count: { _all: true }
    })
  ]);

  const averageEventScore =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((s, r) => s + r.totalScore, 0) / allScores.length) * 100
        ) / 100
      : null;

  let highest: { teamName: string; averageScore: number } | null = null;
  if (withSum.length > 0) {
    const sorted = [...withSum].sort((a, b) => {
      const avA = a._avg.totalScore ?? 0;
      const avB = b._avg.totalScore ?? 0;
      if (avB !== avA) return avB - avA;
      const sA = a._sum.totalScore ?? 0;
      const sB = b._sum.totalScore ?? 0;
      if (sB !== sA) return sB - sA;
      return (b._count._all ?? 0) - (a._count._all ?? 0);
    });
    const top = sorted[0];
    const team = await prisma.team.findUnique({
      where: { id: top.teamId },
      select: { teamName: true }
    });
    if (team) {
      highest = {
        teamName: team.teamName,
        averageScore: Math.round((top._avg.totalScore ?? 0) * 100) / 100
      };
    }
  }

  return {
    totalTeams,
    totalScoresSubmitted,
    averageEventScore,
    highestScoringTeam: highest
  };
}
