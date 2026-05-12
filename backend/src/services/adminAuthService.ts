import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!admin) throw new AppError('Invalid credentials', 401);

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ adminId: admin.id, email: admin.email }, env.jwtSecret, { expiresIn: '7d' });

  return { token, admin: { id: admin.id, email: admin.email } };
}
