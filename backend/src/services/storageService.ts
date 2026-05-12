import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { env } from '../config/env.js';
import { getSupabaseService } from '../lib/supabaseServer.js';
import { AppError } from '../utils/AppError.js';

function publicLocalUploadUrl(filename: string): string {
  return `/uploads/screenshots/${filename}`;
}

function writeLocalScreenshot(file: Express.Multer.File): string {
  const absUploadDir = path.resolve(process.cwd(), env.uploadDir);
  fs.mkdirSync(absUploadDir, { recursive: true });
  const ext = path.extname(file.originalname) || '.png';
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const dest = path.join(absUploadDir, filename);
  fs.writeFileSync(dest, file.buffer);
  return publicLocalUploadUrl(filename);
}

export async function persistRegistrationScreenshot(file: Express.Multer.File): Promise<string> {
  if (env.supabaseStorageEnabled) {
    const supabase = getSupabaseService();
    const ext = path.extname(file.originalname) || '.png';
    const objectPath = `registrations/${Date.now()}-${randomUUID()}${ext}`;
    const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
    if (error) throw new AppError(`Screenshot upload failed: ${error.message}`, 500);

    const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(objectPath);
    if (!data?.publicUrl) throw new AppError('Screenshot upload failed: missing public URL', 500);
    return data.publicUrl;
  }

  return writeLocalScreenshot(file);
}
