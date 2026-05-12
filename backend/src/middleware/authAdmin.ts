import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getSupabaseService } from '../lib/supabaseServer.js';
import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export type AdminJwtPayload = { adminId: string; email: string };

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string };
    }
  }
}

async function verifySupabaseAdminToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!env.supabaseAuthEnabled) return null;
  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) return null;
    const email = data.user.email.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return null;
    return { id: admin.id, email: admin.email };
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) return next(new AppError('Unauthorized', 401));

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AdminJwtPayload;
      const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
      if (admin && admin.email === decoded.email) {
        req.admin = { id: admin.id, email: admin.email };
        return next();
      }
    } catch {
      /* not a legacy JWT */
    }

    const fromSupabase = await verifySupabaseAdminToken(token);
    if (fromSupabase) {
      req.admin = fromSupabase;
      return next();
    }

    return next(new AppError('Unauthorized', 401));
  } catch {
    return next(new AppError('Unauthorized', 401));
  }
}
