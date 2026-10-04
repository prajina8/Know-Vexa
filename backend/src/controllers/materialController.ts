import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Material } from '../models/Material';
import { Subject } from '../models/Subject';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { AppError, notFound, forbidden } from '../utils/AppError';
import { extractPdfText, guessTopics } from '../services/pdf/pdfService';
import { indexMaterial } from '../services/rag/ragService';
import { env } from '../config/env';

function resolveStoredPath(storedPath: string): string {
  return path.resolve(process.cwd(), env.uploadDir, path.basename(storedPath));
}

async function looksLikePdf(filePath: string): Promise<boolean> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(5);
    await handle.read(buf, 0, 5, 0);
    return buf.toString('latin1') === '%PDF-';
  } finally {
    await handle.close();
  }
}

export const uploadMaterial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId, title } = req.body;
  if (!req.file) throw new AppError('No file uploaded', 400);

  
  const discardUpload = () => fs.unlink(req.file!.path).catch(() => undefined);

  if (!subjectId) {
    await discardUpload();
    throw new AppError('subjectId is required', 400);
  }

  const subject = await Subject.findOne({ _id: subjectId, user: req.user!.userId });
  if (!subject) {
    await discardUpload();
    throw notFound('Subject');
  }

  if (!(await looksLikePdf(req.file.path))) {
    await discardUpload();
    throw new AppError('This file is not a valid PDF', 400);
  }

  const material = await Material.create({
    user: req.user!.userId,
    subject: subject._id,
    title: title || req.file.originalname.replace(/\.pdf$/i, ''),
    originalFileName: req.file.originalname,
    filePath: req.file.path,
    fileSizeBytes: req.file.size,
    mimeType: req.file.mimetype,
    status: 'processing',
  });

  res.status(201).json({ success: true, data: material });

  
  runProcessing(material._id.toString());
});

function runProcessing(materialId: string) {
  processMaterial(materialId).catch(async (err) => {
    console.error('[material processing failed]', err);
    await Material.findByIdAndUpdate(materialId, {
      status: 'failed',
      failureReason: err instanceof Error ? err.message : 'Unknown processing error',
    });
  });
}

async function processMaterial(materialId: string) {
  const material = await Material.findById(materialId);
  if (!material) return;

  const { text, pageCount, wordCount } = await extractPdfText(resolveStoredPath(material.filePath));
  if (!text || wordCount < 10) {
    material.status = 'failed';
    material.failureReason = 'Could not extract readable text from this PDF (it may be scanned/image-only).';
    await material.save();
    return;
  }

 
  await Material.findByIdAndUpdate(materialId, {
    extractedText: text,
    pageCount,
    wordCount,
    topics: guessTopics(text),
  });

  await indexMaterial({ materialId: material._id, userId: material.user, text });

  await Material.findByIdAndUpdate(materialId, { status: 'ready' });
}


export async function recoverStuckMaterials() {
  const stuck = await Material.find({ status: { $in: ['processing', 'uploading'] } }).select('_id');
  if (stuck.length === 0) return;
  console.log(`[materials] re-processing ${stuck.length} interrupted material(s)`);
  for (const m of stuck) runProcessing(m._id.toString());
}

export const listMaterials = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.userId };
  if (subjectId) filter.subject = subjectId;

  const materials = await Material.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: materials });
});

export const getMaterial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw notFound('Material');
  if (material.user.toString() !== req.user!.userId) throw forbidden();
  res.json({ success: true, data: material });
});

export const streamMaterialFile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw notFound('Material');
  if (material.user.toString() !== req.user!.userId) throw forbidden();

  const filePath = resolveStoredPath(material.filePath);
  try {
    await fs.access(filePath);
  } catch {
    throw new AppError('The original PDF file is missing from the server', 404);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(material.originalFileName)}`,
  );
  res.sendFile(filePath);
});

export const deleteMaterial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw notFound('Material');
  if (material.user.toString() !== req.user!.userId) throw forbidden();

  await fs.unlink(resolveStoredPath(material.filePath)).catch(() => undefined);
  await material.deleteOne();
  res.json({ success: true, message: 'Material deleted' });
});