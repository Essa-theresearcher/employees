import multer from 'multer';

export const uploadScreenshotMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype);
    if (!ok) return cb(new Error('BAD_REQUEST:Only JPEG, PNG, or WebP images are allowed'));
    cb(null, true);
  }
});
