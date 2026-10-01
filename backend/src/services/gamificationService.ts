import { Types } from 'mongoose';
import { User } from '../models/User';
import { Achievement, AchievementKey } from '../models/Achievement';
import { QuizAttempt } from '../models/QuizAttempt';
import { Flashcard } from '../models/Flashcard';
import { THRESHOLDS } from '../types';

const ACHIEVEMENT_DEFS: Record<AchievementKey, { title: string; description: string; icon: string }> = {
  first_quiz: { title: 'First Quiz', description: 'Completed your first quiz', icon: 'trophy' },
  ten_quizzes: { title: '10 Quizzes Completed', description: 'Completed 10 quizzes', icon: 'medal' },
  hundred_questions: {
    title: '100 Questions Solved',
    description: 'Answered 100 quiz questions',
    icon: 'target',
  },
  seven_day_streak: { title: '7 Day Streak', description: 'Studied 7 days in a row', icon: 'flame' },
  thirty_day_streak: {
    title: '30 Day Streak',
    description: 'Studied 30 days in a row',
    icon: 'flame-kindling',
  },
  first_subject_completed: {
    title: 'First Subject Completed',
    description: 'Reached strong mastery in every topic of a subject',
    icon: 'graduation-cap',
  },
  flashcard_master: {
    title: 'Flashcard Master',
    description: 'Reviewed 100 flashcards',
    icon: 'layers',
  },
};

async function unlock(userId: Types.ObjectId, key: AchievementKey) {
  const def = ACHIEVEMENT_DEFS[key];
  await Achievement.updateOne(
    { user: userId, key },
    { $setOnInsert: { user: userId, key, ...def, unlockedAt: new Date() } },
    { upsert: true },
  );
}

/** Call whenever a study-worthy action happens (quiz submit, flashcard review, chat, etc.) */
export async function registerStudyActivity(userId: Types.ObjectId) {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const last = user.lastStudyDate;
  if (!last) {
    user.currentStreak = 1;
  } else {
    const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    if (hoursSince <= 24) {
      // same-day activity, streak unchanged
    } else if (hoursSince <= THRESHOLDS.STREAK_GRACE_HOURS) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
  }
  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastStudyDate = now;
  await user.save();

  if (user.currentStreak >= 7) await unlock(user._id, 'seven_day_streak');
  if (user.currentStreak >= 30) await unlock(user._id, 'thirty_day_streak');
}

export async function awardXP(userId: Types.ObjectId, amount: number) {
  const user = await User.findById(userId);
  if (!user) return;
  user.xp += amount;
  user.level = 1 + Math.floor(user.xp / 500); // 500 XP per level
  await user.save();
}

export async function checkQuizAchievements(userId: Types.ObjectId) {
  const totalAttempts = await QuizAttempt.countDocuments({ user: userId });
  if (totalAttempts >= 1) await unlock(userId, 'first_quiz');
  if (totalAttempts >= 10) await unlock(userId, 'ten_quizzes');

  const agg = await QuizAttempt.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, totalQuestions: { $sum: '$totalQuestions' } } },
  ]);
  if ((agg[0]?.totalQuestions ?? 0) >= 100) await unlock(userId, 'hundred_questions');
}

export async function checkFlashcardAchievements(userId: Types.ObjectId) {
  const agg = await Flashcard.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: '$timesReviewed' } } },
  ]);
  if ((agg[0]?.total ?? 0) >= 100) await unlock(userId, 'flashcard_master');
}
