import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { MAX_PDF_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../../../shared/src/constants/examConfig';
import { AppError } from './errorHandler';

// ─── Ensure upload directory exists ──────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `import-${uniqueSuffix}${ext}`);
  },
});

// ─── File filter ──────────────────────────────────────────────────────────────
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as 'application/pdf')) {
    return cb(
      new AppError(400, 'Only PDF files are allowed', 'INVALID_FILE_TYPE'),
    );
  }
  cb(null, true);
}

export const pdfUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PDF_SIZE_BYTES,
  },
});
