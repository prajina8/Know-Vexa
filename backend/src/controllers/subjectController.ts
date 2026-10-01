import { Response } from 'express';
import { Types } from 'mongoose';
import { Subject } from '../models/Subject';
import { Material } from '../models/Material';
import { Quiz } from '../models/Quiz';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { notFound, forbidden } from '../utils/AppError';
import { computeTopicStats, splitWeakStrong } from '../services/analyticsService';

export const listSubjects = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const subjects = await Subject.find({ user: req.user!.userId }).sort({ createdAt: -1 }).lean();

  const enriched = await Promise.all(
    subjects.map(async (s) => {
      const [materialCount, quizCount] = await Promise.all([
        Material.countDocuments({ subject: s._id }),
        Quiz.countDocuments({ subject: s._id }),
      ]);
      return { ...s, materialCount, quizCount };
    }),
  );

  res.json({ success: true, data: enriched });
});

export const createSubject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const subject = await Subject.create({ ...req.body, user: req.user!.userId });
  res.status(201).json({ success: true, data: subject });
});

async function getOwnedSubject(id: string, userId: string) {
  const subject = await Subject.findById(id);
  if (!subject) throw notFound('Subject');
  if (subject.user.toString() !== userId) throw forbidden('This subject does not belong to you');
  return subject;
}

export const getSubject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const subject = await getOwnedSubject(req.params.id, req.user!.userId);
  const materials = await Material.find({ subject: subject._id })
    .select('-extractedText')
    .sort({ createdAt: -1 });
  const quizzes = await Quiz.find({ subject: subject._id }).sort({ createdAt: -1 }).select('-questions.correctAnswer -questions.explanation');

  const topicStats = await computeTopicStats(new Types.ObjectId(req.user!.userId), subject._id);
  const { weak, strong } = splitWeakStrong(topicStats);

  res.json({ success: true, data: { subject, materials, quizzes, weakTopics: weak, strongTopics: strong } });
});

export const updateSubject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const subject = await getOwnedSubject(req.params.id, req.user!.userId);
  Object.assign(subject, req.body);
  await subject.save();
  res.json({ success: true, data: subject });
});

export const deleteSubject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const subject = await getOwnedSubject(req.params.id, req.user!.userId);
  await subject.deleteOne();
  res.json({ success: true, message: 'Subject deleted' });
});
