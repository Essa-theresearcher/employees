import type { ContributionFocus, PaymentMethod, RegistrationStatus, SkillLevel } from '@prisma/client';
import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';
import { allocateNextBadgeId } from './badgeSerial.js';
import { env } from '../config/env.js';

/** Badge QR → /register?id=…; built from PUBLIC_APP_URL (+ optional PUBLIC_APP_BASE_PATH for GitHub Pages). */
export function buildBadgeQrTargetUrl(registrationId: string): string {
  const origin = env.publicAppUrl.replace(/\/+$/, '');
  let prefix = env.publicAppBasePath;
  if (prefix && origin.toLowerCase().endsWith(prefix.toLowerCase())) {
    prefix = '';
  }
  return `${origin}${prefix}/register?id=${encodeURIComponent(registrationId)}`;
}

const normalizeMpesaCode = (code: string | undefined | null): string | null => {
  const t = code?.trim();
  return t ? t.toUpperCase() : null;
};

export async function createRegistration(input: {
  fullName: string;
  phone: string;
  email: string;
  contributionFocus: ContributionFocus;
  skillLevel: SkillLevel;
  paymentMethod: PaymentMethod;
  mpesaTransactionCode?: string | null;
  mpesaConfirmationMessage?: string | null;
  screenshotPath: string | null;
  agreementAccepted: boolean;
}) {
  if (!input.agreementAccepted) throw new AppError('You must confirm payment and badge verification terms.', 400);

  const event = await prisma.eventSettings.findUnique({ where: { singletonKey: 1 } });
  if (!event) throw new AppError('Event is not configured.', 503);

  const mpesaCode = input.paymentMethod === 'MPESA' ? normalizeMpesaCode(input.mpesaTransactionCode) : null;
  const mpesaMessage =
    input.paymentMethod === 'MPESA' ? input.mpesaConfirmationMessage?.trim() || null : null;

  if (input.paymentMethod === 'MPESA') {
    if (!mpesaCode) throw new AppError('M-Pesa transaction code is required.', 400);
    if (!mpesaMessage) throw new AppError('M-Pesa confirmation message is required.', 400);
    if (!input.screenshotPath) throw new AppError('Payment screenshot is required for M-Pesa payments.', 400);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          email: input.email.trim().toLowerCase(),
          contributionFocus: input.contributionFocus,
          skillLevel: input.skillLevel,
          paymentMethod: input.paymentMethod,
          mpesaTransactionCode: mpesaCode,
          mpesaConfirmationMessage: mpesaMessage,
          screenshotPath: input.screenshotPath,
          agreementAccepted: true
        }
      });

      await tx.payment.create({
        data: {
          registrationId: registration.id,
          amountKes: event.amountKes,
          method: input.paymentMethod,
          mpesaCode,
          verified: false
        }
      });

      return registration;
    });
  } catch (e: unknown) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code?: string }).code) : '';
    if (code === 'P2002') throw new AppError('This M-Pesa transaction code was already used.', 409);
    throw e;
  }
}

export async function verifyBadgePublic(badgeId: string) {
  const badge = await prisma.badge.findUnique({
    where: { badgeId },
    include: { registration: true }
  });

  const event = await prisma.eventSettings.findUnique({ where: { singletonKey: 1 } });

  if (!badge || badge.registration.status !== 'VERIFIED') {
    return {
      valid: false as const,
      badgeId,
      status: 'Invalid' as const,
      eventName: event?.eventName ?? 'Coffee & Code'
    };
  }

  return {
    valid: true as const,
    badgeId: badge.badgeId,
    name: badge.registration.fullName,
    eventName: event?.eventName ?? 'Coffee & Code',
    status: 'Verified' as const,
    contributionFocus: badge.registration.contributionFocus
  };
}

export async function listRegistrations(filters: {
  q?: string;
  status?: RegistrationStatus;
}) {
  const q = filters.q?.trim();
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
            { mpesaTransactionCode: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const rows = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      payment: true,
      badge: true
    }
  });

  return rows.map((row) =>
    row.badge
      ? { ...row, badge: { ...row.badge, qrTargetUrl: buildBadgeQrTargetUrl(row.id) } }
      : row
  );
}

export async function getRegistration(id: string) {
  const row = await prisma.registration.findUnique({
    where: { id },
    include: { payment: true, badge: true }
  });
  if (!row) throw new AppError('Registration not found', 404);
  if (!row.badge) return row;
  return { ...row, badge: { ...row.badge, qrTargetUrl: buildBadgeQrTargetUrl(row.id) } };
}

export async function approveRegistration(registrationId: string, adminId: string, adminNote?: string | null) {
  await prisma.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({ where: { id: registrationId } });
    if (!reg) throw new AppError('Registration not found', 404);
    if (reg.status !== 'PENDING') throw new AppError('Only pending registrations can be approved.', 400);

    const badgeId = await allocateNextBadgeId(tx);
    const qrTargetUrl = buildBadgeQrTargetUrl(registrationId);

    await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: adminId,
        rejectedAt: null,
        adminNote: adminNote?.trim() || reg.adminNote
      }
    });

    await tx.payment.update({
      where: { registrationId },
      data: { verified: true }
    });

    await tx.badge.create({
      data: {
        registrationId,
        badgeId,
        qrTargetUrl
      }
    });
  });

  return getRegistration(registrationId);
}

function mapPaymentStatus(status: RegistrationStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'VERIFIED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}

export type AttendeeDto = {
  id: string;
  badgeId: string;
  fullName: string;
  phone: string;
  email: string;
  paymentStatus: 'pending' | 'approved' | 'rejected';
  checkedIn: boolean;
  checkedInAt: string | null;
};

function toAttendeeDto(row: {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  checkedInAt: Date | null;
  badge: { badgeId: string } | null;
}): AttendeeDto | null {
  if (!row.badge) return null;
  return {
    id: row.id,
    badgeId: row.badge.badgeId,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    paymentStatus: mapPaymentStatus(row.status),
    checkedIn: row.checkedIn,
    checkedInAt: row.checkedInAt ? row.checkedInAt.toISOString() : null
  };
}

export async function getAttendeeByBadgeId(badgeId: string): Promise<AttendeeDto> {
  const badge = await prisma.badge.findUnique({
    where: { badgeId },
    include: { registration: true }
  });
  if (!badge) throw new AppError('Attendee not found', 404);

  return {
    id: badge.registration.id,
    badgeId: badge.badgeId,
    fullName: badge.registration.fullName,
    phone: badge.registration.phone,
    email: badge.registration.email,
    paymentStatus: mapPaymentStatus(badge.registration.status),
    checkedIn: badge.registration.checkedIn,
    checkedInAt: badge.registration.checkedInAt ? badge.registration.checkedInAt.toISOString() : null
  };
}

export async function checkInAttendeeByBadgeId(badgeId: string): Promise<AttendeeDto> {
  const badge = await prisma.badge.findUnique({
    where: { badgeId },
    include: { registration: true }
  });
  if (!badge) throw new AppError('Attendee not found', 404);

  const reg = badge.registration;
  if (reg.status !== 'VERIFIED') throw new AppError('Payment not approved', 409);
  if (reg.checkedIn) throw new AppError('Already checked in', 409);

  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: {
      checkedIn: true,
      checkedInAt: new Date()
    }
  });

  return {
    id: updated.id,
    badgeId: badge.badgeId,
    fullName: updated.fullName,
    phone: updated.phone,
    email: updated.email,
    paymentStatus: mapPaymentStatus(updated.status),
    checkedIn: updated.checkedIn,
    checkedInAt: updated.checkedInAt ? updated.checkedInAt.toISOString() : null
  };
}

export async function listCheckinAttendees(q?: string): Promise<AttendeeDto[]> {
  const search = q?.trim();
  const rows = await prisma.registration.findMany({
    where: {
      status: 'VERIFIED',
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { badge: { is: { badgeId: { contains: search, mode: 'insensitive' as const } } } }
            ]
          }
        : {})
    },
    include: { badge: true },
    orderBy: [{ checkedIn: 'asc' }, { fullName: 'asc' }]
  });

  return rows
    .map(toAttendeeDto)
    .filter((r): r is AttendeeDto => r !== null);
}

export async function getCheckinMetrics() {
  const [totalRegistered, paymentApproved, checkedIn] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { status: 'VERIFIED' } }),
    prisma.registration.count({ where: { status: 'VERIFIED', checkedIn: true } })
  ]);

  return {
    totalRegistered,
    paymentApproved,
    checkedIn,
    notCheckedIn: paymentApproved - checkedIn
  };
}

export async function rejectRegistration(registrationId: string, adminId: string, adminNote?: string | null) {
  const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!reg) throw new AppError('Registration not found', 404);
  if (reg.status !== 'PENDING') throw new AppError('Only pending registrations can be rejected.', 400);

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      verifiedById: adminId,
      verifiedAt: null,
      adminNote: adminNote?.trim() || reg.adminNote
    }
  });

  return getRegistration(registrationId);
}
