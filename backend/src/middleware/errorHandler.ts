import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

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

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
