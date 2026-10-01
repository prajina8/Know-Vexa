import { Response } from 'express';
import fs from 'fs/promises';
import { Material } from '../models/Material';
import { Subject } from '../models/Subject';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { AppError, notFound, forbidden } from '../utils/AppError';
import { extractPdfText, guessTopics } from '../services/pdf/pdfService';
import { indexMaterial } from '../services/rag/ragService';

export const uploadMaterial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId, title } = req.body;
  if (!req.file) throw new AppError('No file uploaded', 400);
  if (!subjectId) throw new AppError('subjectId is required', 400);

  const subject = await Subject.findOne({ _id: subjectId, user: req.user!.userId });
  if (!subject) throw notFound('Subject');

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

  // Process asynchronously so the upload response returns immediately;
  // the client polls /materials/:id for status transitions.
  processMaterial(material._id.toString()).catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('[material processing failed]', err);
    await Material.findByIdAndUpdate(material._id, {
      status: 'failed',
      failureReason: err instanceof Error ? err.message : 'Unknown processing error',
    });
  });
});

async function processMaterial(materialId: string) {
  const material = await Material.findById(materialId);
  if (!material) return;

  const { text, pageCount, wordCount } = await extractPdfText(material.filePath);
  if (!text || wordCount < 10) {
    material.status = 'failed';
    material.failureReason = 'Could not extract readable text from this PDF (it may be scanned/image-only).';
    await material.save();
    return;
  }

  const topics = guessTopics(text);
  await Material.findByIdAndUpdate(materialId, {
    extractedText: text,
    pageCount,
    wordCount,
    topics,
    status: 'ready',
  });

  await indexMaterial({ materialId: material._id, userId: material.user, text });
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

export const deleteMaterial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw notFound('Material');
  if (material.user.toString() !== req.user!.userId) throw forbidden();

  await fs.unlink(material.filePath).catch(() => undefined);
  await material.deleteOne();
  res.json({ success: true, message: 'Material deleted' });
});
