import { Response } from 'express';
import { Types } from 'mongoose';
import { Quiz } from '../models/Quiz';
import { QuizAttempt, IAnswerRecord, ITopicPerformance } from '../models/QuizAttempt';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest, THRESHOLDS } from '../types';
import { notFound, forbidden, badRequest } from '../utils/AppError';
import { registerStudyActivity, awardXP, checkQuizAchievements } from '../services/gamificationService';
import { StudySession } from '../models/StudySession';

export const listQuizzes = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.userId };
  if (subjectId) filter.subject = subjectId;

  const quizzes = await Quiz.find(filter)
    .select('-questions.correctAnswer -questions.explanation')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: quizzes });
});

export const getQuiz = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw notFound('Quiz');
  if (quiz.user.toString() !== req.user!.userId) throw forbidden();

  // Strip correct answers/explanations before the quiz is taken.
  const safeQuiz = quiz.toObject();
  safeQuiz.questions = safeQuiz.questions.map((q) => ({
    ...q,
    correctAnswer: undefined,
    explanation: undefined,
  })) as never;

  res.json({ success: true, data: safeQuiz });
});

export const submitQuiz = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { answers, timeTakenSeconds, startedAt } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw notFound('Quiz');
  if (quiz.user.toString() !== req.user!.userId) throw forbidden();
  if (!Array.isArray(answers)) throw badRequest('answers must be an array');

  const answerMap = new Map<string, string | undefined>(
    answers.map((a: { questionId: string; givenAnswer?: string }) => [a.questionId, a.givenAnswer]),
  );

  const records: IAnswerRecord[] = [];
  const topicTally = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;
  let skippedCount = 0;

  for (const q of quiz.questions) {
    const given = answerMap.get(q._id!.toString());
    const isSkipped = given === undefined || given === '';
    let isCorrect = false;
    if (!isSkipped) {
      isCorrect = normalize(given) === normalize(q.correctAnswer);
    }
    if (isSkipped) skippedCount++;
    if (isCorrect) correctCount++;

    records.push({
      questionId: q._id as Types.ObjectId,
      topic: q.topic,
      difficulty: q.difficulty,
      givenAnswer: given,
      isCorrect,
      isSkipped,
    });

    const tally = topicTally.get(q.topic) ?? { correct: 0, total: 0 };
    tally.total += 1;
    if (isCorrect) tally.correct += 1;
    topicTally.set(q.topic, tally);
  }

  const total = quiz.questions.length;
  const wrongCount = total - correctCount - skippedCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const topicPerformance: ITopicPerformance[] = Array.from(topicTally.entries()).map(
    ([topic, t]) => ({
      topic,
      correct: t.correct,
      total: t.total,
      percentage: Math.round((t.correct / t.total) * 100),
    }),
  );

  const attempt = await QuizAttempt.create({
    user: req.user!.userId,
    quiz: quiz._id,
    subject: quiz.subject,
    answers: records,
    score: correctCount,
    totalQuestions: total,
    correctCount,
    wrongCount,
    skippedCount,
    percentage,
    timeTakenSeconds,
    topicPerformance,
    startedAt: new Date(startedAt),
    submittedAt: new Date(),
  });

  await StudySession.create({
    user: req.user!.userId,
    subject: quiz.subject,
    activityType: 'quiz',
    durationMinutes: Math.round(timeTakenSeconds / 60) || 1,
  });

  const userIdObj = new Types.ObjectId(req.user!.userId);
  await registerStudyActivity(userIdObj);
  await awardXP(
    userIdObj,
    correctCount * THRESHOLDS.XP_PER_CORRECT_ANSWER + THRESHOLDS.XP_PER_QUIZ_COMPLETED,
  );
  await checkQuizAchievements(userIdObj);

  // Return attempt plus the full quiz (with explanations) for the result page.
  res.status(201).json({
    success: true,
    data: {
      attempt,
      quiz: {
        title: quiz.title,
        questions: quiz.questions,
      },
      weakTopics: topicPerformance.filter((t) => t.percentage < THRESHOLDS.WEAK_TOPIC_MAX_PERCENT),
    },
  });
});

export const getQuizAttempt = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const attempt = await QuizAttempt.findById(req.params.id).populate('quiz');
  if (!attempt) throw notFound('Quiz attempt');
  if (attempt.user.toString() !== req.user!.userId) throw forbidden();
  res.json({ success: true, data: attempt });
});

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}
