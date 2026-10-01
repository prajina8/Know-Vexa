import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const uploadDir = path.resolve(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError('Only PDF files are supported', 400));
  }
  cb(null, true);
}

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
});
