import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const exposeServerErrors = process.env.EXPOSE_SERVER_ERRORS === 'true';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Screenshot file is too large (max 5MB).' : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  if (err instanceof Error && err.message.startsWith('BAD_REQUEST:')) {
    return res.status(400).json({ success: false, message: err.message.replace(/^BAD_REQUEST:/, '') });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(503).json({
      success: false,
      message:
        'Database connection failed. On Render + Supabase, ensure DATABASE_URL is correct and often includes ?sslmode=require (see Supabase connection string).',
      ...(exposeServerErrors ? { detail: err.message } : {})
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // eslint-disable-next-line no-console
    console.error(err);
    const msg =
      err.code === 'P1001'
        ? 'Cannot reach the database server (network, firewall, or wrong DATABASE_URL).'
        : `Database error (${err.code})`;
    return res.status(err.code === 'P1001' ? 503 : 400).json({
      success: false,
      message: msg,
      ...(exposeServerErrors ? { detail: err.message, code: err.code } : {})
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(400).json({
      success: false,
      message: 'Invalid request for database',
      ...(exposeServerErrors ? { detail: err.message } : {})
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  const detail =
    exposeServerErrors && err instanceof Error ? err.message : exposeServerErrors ? String(err) : undefined;
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(detail ? { detail } : {}),
    ...(!exposeServerErrors ? { hint: 'Set EXPOSE_SERVER_ERRORS=true on Render temporarily to include error detail in JSON, or read this service’s logs.' } : {})
  });
}
