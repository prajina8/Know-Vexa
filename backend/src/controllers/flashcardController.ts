import { Response } from 'express';
import { Types } from 'mongoose';
import { Flashcard } from '../models/Flashcard';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { notFound, forbidden } from '../utils/AppError';
import { registerStudyActivity, awardXP, checkFlashcardAchievements } from '../services/gamificationService';
import { THRESHOLDS } from '../types';
import { StudySession } from '../models/StudySession';

// Simple spaced-repetition interval scheme keyed by self-rating.
const REVIEW_INTERVAL_DAYS: Record<'hard' | 'good' | 'easy', number> = {
  hard: 0.5, // ~12h - resurface soon
  good: 2,
  easy: 6,
};

export const listFlashcards = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId, dueOnly } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.userId };
  if (subjectId) filter.subject = subjectId;
  if (dueOnly === 'true') filter.nextReviewAt = { $lte: new Date() };

  // Difficult cards (hard rating / low streak) surface first.
  const cards = await Flashcard.find(filter).sort({
    lastRating: 1, // 'hard' < 'good' sorts hard-ish first alphabetically as a tiebreaker
    timesCorrectStreak: 1,
    nextReviewAt: 1,
  });
  res.json({ success: true, data: cards });
});

export const rateFlashcard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { rating } = req.body as { rating: 'hard' | 'good' | 'easy' };
  const card = await Flashcard.findById(req.params.id);
  if (!card) throw notFound('Flashcard');
  if (card.user.toString() !== req.user!.userId) throw forbidden();

  card.lastRating = rating;
  card.timesReviewed += 1;
  card.timesCorrectStreak = rating === 'hard' ? 0 : card.timesCorrectStreak + 1;
  const intervalMs = REVIEW_INTERVAL_DAYS[rating] * 24 * 60 * 60 * 1000;
  card.nextReviewAt = new Date(Date.now() + intervalMs);
  await card.save();

  const userIdObj = new Types.ObjectId(req.user!.userId);
  await StudySession.create({
    user: userIdObj,
    subject: card.subject,
    activityType: 'flashcards',
    durationMinutes: 1,
  });
  await registerStudyActivity(userIdObj);
  await awardXP(userIdObj, THRESHOLDS.XP_PER_FLASHCARD_SESSION);
  await checkFlashcardAchievements(userIdObj);

  res.json({ success: true, data: card });
});

export const deleteFlashcard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const card = await Flashcard.findById(req.params.id);
  if (!card) throw notFound('Flashcard');
  if (card.user.toString() !== req.user!.userId) throw forbidden();
  await card.deleteOne();
  res.json({ success: true, message: 'Flashcard deleted' });
});
