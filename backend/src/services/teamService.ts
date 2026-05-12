import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export const MAX_TEAM_SIZE = 5;

export type TeamDto = {
  id: string;
  teamName: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  members: TeamMemberDto[];
};

export type TeamMemberDto = {
  id: string;
  attendeeId: string;
  fullName: string;
  roleInTeam: string | null;
  skills: string | null;
  joinedAt: string;
};

function teamRowToDto(row: {
  id: string;
  teamName: string;
  description: string | null;
  createdAt: Date;
  members: {
    id: string;
    roleInTeam: string | null;
    skills: string | null;
    joinedAt: Date;
    registration: { fullName: string; badge: { badgeId: string } | null };
  }[];
}): TeamDto {
  return {
    id: row.id,
    teamName: row.teamName,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    memberCount: row.members.length,
    members: row.members.map((m) => ({
      id: m.id,
      attendeeId: m.registration.badge?.badgeId ?? '',
      fullName: m.registration.fullName,
      roleInTeam: m.roleInTeam,
      skills: m.skills,
      joinedAt: m.joinedAt.toISOString()
    }))
  };
}

export async function listTeams(): Promise<TeamDto[]> {
  const rows = await prisma.team.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
        include: { registration: { include: { badge: true } } }
      }
    }
  });
  return rows.map(teamRowToDto);
}

export async function getTeam(teamId: string): Promise<TeamDto> {
  const row = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
        include: { registration: { include: { badge: true } } }
      }
    }
  });
  if (!row) throw new AppError('Team not found', 404);
  return teamRowToDto(row);
}

export async function createTeam(input: {
  teamName: string;
  description?: string | null;
}): Promise<TeamDto> {
  const teamName = input.teamName?.trim();
  if (!teamName) throw new AppError('Team name is required.', 400);
  if (teamName.length > 80) throw new AppError('Team name is too long.', 400);

  const description = input.description?.trim() || null;

  try {
    const created = await prisma.team.create({
      data: { teamName, description }
    });
    return getTeam(created.id);
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e && 'code' in e ? String((e as { code?: string }).code) : '';
    if (code === 'P2002') throw new AppError('A team with that name already exists.', 409);
    throw e;
  }
}

async function resolveAttendee(attendeeRef: string) {
  const ref = attendeeRef?.trim();
  if (!ref) throw new AppError('Attendee identifier is required.', 400);

  const byBadge = await prisma.registration.findFirst({
    where: { badge: { is: { badgeId: { equals: ref, mode: 'insensitive' } } } },
    include: { badge: true, teamMember: true }
  });
  if (byBadge) return byBadge;

  const byPhone = await prisma.registration.findFirst({
    where: { phone: ref },
    include: { badge: true, teamMember: true }
  });
  if (byPhone) return byPhone;

  throw new AppError('Attendee not found.', 404);
}

export async function joinTeam(input: {
  teamId: string;
  attendeeId: string;
  roleInTeam?: string | null;
  skills?: string | null;
}): Promise<TeamDto> {
  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    include: { _count: { select: { members: true } } }
  });
  if (!team) throw new AppError('Team not found', 404);
  if (team._count.members >= MAX_TEAM_SIZE) throw new AppError('This team is full', 409);

  const attendee = await resolveAttendee(input.attendeeId);
  if (!attendee.checkedIn) throw new AppError('You must check in before joining a team', 409);
  if (attendee.teamMember) throw new AppError('This attendee is already in a team', 409);

  await prisma.teamMember.create({
    data: {
      registrationId: attendee.id,
      teamId: input.teamId,
      roleInTeam: input.roleInTeam?.trim() || null,
      skills: input.skills?.trim() || null
    }
  });

  return getTeam(input.teamId);
}

export async function leaveTeam(input: { teamId: string; attendeeId: string }): Promise<TeamDto> {
  const attendee = await resolveAttendee(input.attendeeId);
  if (!attendee.teamMember || attendee.teamMember.teamId !== input.teamId) {
    throw new AppError('Attendee is not in this team.', 409);
  }
  await prisma.teamMember.delete({ where: { id: attendee.teamMember.id } });
  return getTeam(input.teamId);
}

export async function removeMemberAsAdmin(memberId: string): Promise<void> {
  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError('Team member not found', 404);
  await prisma.teamMember.delete({ where: { id: memberId } });
}

export async function deleteEmptyTeam(teamId: string): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } }
  });
  if (!team) throw new AppError('Team not found', 404);
  if (team._count.members > 0) {
    throw new AppError('Only empty teams can be deleted. Remove members first.', 409);
  }
  await prisma.team.delete({ where: { id: teamId } });
}

export type AvailableAttendeeDto = {
  attendeeId: string;
  fullName: string;
};

export async function listAvailableAttendees(): Promise<AvailableAttendeeDto[]> {
  const rows = await prisma.registration.findMany({
    where: {
      status: 'VERIFIED',
      checkedIn: true,
      teamMember: { is: null }
    },
    include: { badge: true },
    orderBy: { fullName: 'asc' }
  });

  return rows
    .map((r) => ({
      attendeeId: r.badge?.badgeId ?? '',
      fullName: r.fullName
    }))
    .filter((r) => r.attendeeId);
}

export async function getTeamMetrics() {
  const [totalTeams, checkedInAttendees, attendeesInTeams] = await Promise.all([
    prisma.team.count(),
    prisma.registration.count({ where: { status: 'VERIFIED', checkedIn: true } }),
    prisma.teamMember.count()
  ]);

  return {
    totalTeams,
    checkedInAttendees,
    attendeesInTeams,
    attendeesWithoutTeams: Math.max(0, checkedInAttendees - attendeesInTeams)
  };
}
