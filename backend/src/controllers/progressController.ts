import { Response } from 'express';
import { Types } from 'mongoose';
import { Material } from '../models/Material';
import { Subject } from '../models/Subject';
import { Quiz } from '../models/Quiz';
import { QuizAttempt } from '../models/QuizAttempt';
import { StudySession } from '../models/StudySession';
import { StudyPlan } from '../models/StudyPlan';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../types';
import { computeTopicStats, splitWeakStrong } from '../services/analyticsService';

export const getDashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = new Types.ObjectId(req.user!.userId);

  const [materialCount, quizAttempts, sessions, subjects, topicStats, activePlan, recentAttempts] =
    await Promise.all([
      Material.countDocuments({ user: userId }),
      QuizAttempt.find({ user: userId }).sort({ submittedAt: -1 }).lean(),
      StudySession.find({ user: userId }).lean(),
      Subject.find({ user: userId }).lean(),
      computeTopicStats(userId),
      StudyPlan.findOne({ user: userId, range: 'daily' }).sort({ createdAt: -1 }).lean(),
      QuizAttempt.find({ user: userId }).sort({ submittedAt: -1 }).limit(5).populate('quiz', 'title').lean(),
    ]);

  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const avgScore =
    quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
      : 0;

  const { weak, strong } = splitWeakStrong(topicStats);

  const subjectProgress = await Promise.all(
    subjects.map(async (s) => {
      const attempts = quizAttempts.filter((a) => a.subject.toString() === s._id.toString());
      const avg =
        attempts.length > 0
          ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
          : 0;
      const materials = await Material.countDocuments({ subject: s._id });
      return { subjectId: s._id, name: s.name, color: s.color, averageScore: avg, quizzesTaken: attempts.length, materials };
    }),
  );

  const recentActivity = recentAttempts.map((a) => ({
    type: 'quiz' as const,
    label: (a.quiz as unknown as { title?: string })?.title ?? 'Quiz',
    percentage: a.percentage,
    date: a.submittedAt,
  }));

  res.json({
    success: true,
    data: {
      totalStudyMinutes,
      materialCount,
      quizzesCompleted: quizAttempts.length,
      averageScore: avgScore,
      currentStreak: (req as unknown as { userStreak?: number }).userStreak, // filled below if needed
      subjectProgress,
      recentActivity,
      weakTopics: weak.slice(0, 5),
      recommendedTopics: weak.slice(0, 3),
      upcomingTasks: activePlan?.tasks.filter((t) => !t.completed).slice(0, 5) ?? [],
    },
  });
});

export const getSubjectProgress = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = new Types.ObjectId(req.user!.userId);
  const subjectId = new Types.ObjectId(req.params.id);

  const [attempts, topicStats] = await Promise.all([
    QuizAttempt.find({ user: userId, subject: subjectId }).sort({ submittedAt: 1 }).lean(),
    computeTopicStats(userId, subjectId),
  ]);

  const { weak, strong } = splitWeakStrong(topicStats);
  const trend = attempts.map((a) => ({ date: a.submittedAt, percentage: a.percentage }));

  res.json({ success: true, data: { trend, topicStats, weakTopics: weak, strongTopics: strong } });
});

export const getOverallProgress = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = new Types.ObjectId(req.user!.userId);

  const attempts = await QuizAttempt.find({ user: userId }).sort({ submittedAt: 1 }).lean();
  const trend = attempts.map((a) => ({ date: a.submittedAt, percentage: a.percentage }));

  const bySubject = await QuizAttempt.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$subject', avg: { $avg: '$percentage' }, count: { $sum: 1 } } },
  ]);
  const subjects = await Subject.find({ user: userId }).lean();
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]));
  const subjectComparison = bySubject.map((b) => ({
    subject: subjectMap.get(b._id.toString()) ?? 'Unknown',
    averageScore: Math.round(b.avg),
    quizzesTaken: b.count,
  }));

  const totalCorrect = attempts.reduce((s, a) => s + a.correctCount, 0);
  const totalWrong = attempts.reduce((s, a) => s + a.wrongCount, 0);
  const totalSkipped = attempts.reduce((s, a) => s + a.skippedCount, 0);

  const topicStats = await computeTopicStats(userId);
  const { weak, strong } = splitWeakStrong(topicStats);

  res.json({
    success: true,
    data: {
      trend,
      subjectComparison,
      accuracyBreakdown: { correct: totalCorrect, wrong: totalWrong, skipped: totalSkipped },
      weakTopics: weak,
      strongTopics: strong,
    },
  });
});
