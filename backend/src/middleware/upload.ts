import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

const absUploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(absUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, absUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  }
});

export const uploadScreenshot = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype);
    if (!ok) return cb(new Error('BAD_REQUEST:Only JPEG, PNG, or WebP images are allowed'));
    cb(null, true);
  }
});

export function publicUploadUrl(filename: string): string {
  return `/uploads/screenshots/${filename}`;
}
