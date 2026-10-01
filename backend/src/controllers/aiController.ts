import { Response } from 'express';
import { Types } from 'mongoose';
import { Material } from '../models/Material';
import { Subject } from '../models/Subject';
import { Quiz } from '../models/Quiz';
import { Flashcard } from '../models/Flashcard';
import { ChatHistory } from '../models/ChatHistory';
import { StudyPlan } from '../models/StudyPlan';
import { StudySession } from '../models/StudySession';
import { QuizAttempt } from '../models/QuizAttempt';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest, AIQuizQuestion, AIFlashcard, AISummaryResult } from '../types';
import { AppError, notFound, forbidden } from '../utils/AppError';
import { getAIProvider } from '../services/ai';
import {
  summaryPrompt,
  chatPrompt,
  quizGenPrompt,
  flashcardGenPrompt,
  studyPlanPrompt,
  recommendationsPrompt,
} from '../services/ai/prompts';
import { retrieveContext } from '../services/rag/ragService';
import {
  computeTopicStats,
  splitWeakStrong,
  computeImprovements,
  computeStrugglingStreaks,
} from '../services/analyticsService';
import { registerStudyActivity } from '../services/gamificationService';

async function getOwnedMaterial(materialId: string, userId: string) {
  const material = await Material.findById(materialId).select('+extractedText');
  if (!material) throw notFound('Material');
  if (material.user.toString() !== userId) throw forbidden();
  if (material.status !== 'ready') {
    throw new AppError(`Material is not ready yet (status: ${material.status})`, 409);
  }
  return material;
}

export const summarize = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { materialId, length } = req.body;
  const material = await getOwnedMaterial(materialId, req.user!.userId);

  const ai = getAIProvider();
  const { system, prompt } = summaryPrompt(material.extractedText || '', length);
  const result = await ai.completeJSON<AISummaryResult>({ system, prompt, maxTokens: 3000 });

  await StudySession.create({
    user: req.user!.userId,
    subject: material.subject,
    activityType: 'summary',
    durationMinutes: 2,
  });
  await registerStudyActivity(new Types.ObjectId(req.user!.userId));

  res.json({ success: true, data: result });
});

export const chat = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { materialId, message } = req.body;
  const material = await getOwnedMaterial(materialId, req.user!.userId);

  let history = await ChatHistory.findOne({ user: req.user!.userId, material: material._id });
  if (!history) {
    history = await ChatHistory.create({ user: req.user!.userId, material: material._id, messages: [] });
  }

  const { context, usedContext } = await retrieveContext({
    materialId: material._id,
    query: message,
  });

  const historyText = history.messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const ai = getAIProvider();
  const { system, prompt } = chatPrompt(message, context, historyText);
  const answer = await ai.complete({ system, prompt, maxTokens: 1200 });

  history.messages.push({ role: 'user', content: message, createdAt: new Date() } as never);
  history.messages.push({
    role: 'assistant',
    content: answer,
    usedContext,
    createdAt: new Date(),
  } as never);
  await history.save();

  await StudySession.create({
    user: req.user!.userId,
    subject: material.subject,
    activityType: 'chat',
    durationMinutes: 1,
  });
  await registerStudyActivity(new Types.ObjectId(req.user!.userId));

  res.json({ success: true, data: { answer, usedContext } });
});

export const getChatHistory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const material = await Material.findById(req.params.materialId);
  if (!material) throw notFound('Material');
  if (material.user.toString() !== req.user!.userId) throw forbidden();

  const history = await ChatHistory.findOne({ user: req.user!.userId, material: material._id });
  res.json({ success: true, data: history?.messages ?? [] });
});

export const clearChatHistory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await ChatHistory.findOneAndUpdate(
    { user: req.user!.userId, material: req.params.materialId },
    { $set: { messages: [] } },
  );
  res.json({ success: true, message: 'Chat cleared' });
});

export const generateQuiz = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId, materialId, topic, numQuestions, difficulty, questionTypes, timeLimitMinutes } =
    req.body;

  const subject = await Subject.findOne({ _id: subjectId, user: req.user!.userId });
  if (!subject) throw notFound('Subject');

  let sourceText = '';
  if (materialId) {
    const material = await getOwnedMaterial(materialId, req.user!.userId);
    sourceText = material.extractedText || '';
  } else {
    const materials = await Material.find({ subject: subject._id, status: 'ready' }).select(
      '+extractedText',
    );
    if (materials.length === 0) {
      throw new AppError('No ready materials found for this subject to generate a quiz from', 400);
    }
    sourceText = materials.map((m) => m.extractedText).join('\n\n').slice(0, 60000);
  }

  const ai = getAIProvider();
  const { system, prompt } = quizGenPrompt({
    text: sourceText,
    topic,
    numQuestions,
    difficulty,
    questionTypes,
  });
  const result = await ai.completeJSON<{ questions: AIQuizQuestion[] }>({
    system,
    prompt,
    maxTokens: 4000,
  });

  const quiz = await Quiz.create({
    user: req.user!.userId,
    subject: subject._id,
    material: materialId || undefined,
    title: topic ? `${subject.name}: ${topic}` : `${subject.name} Quiz`,
    topic,
    difficulty,
    questionTypes,
    questions: result.questions,
    timeLimitMinutes,
  });

  res.status(201).json({ success: true, data: quiz });
});

export const generateFlashcards = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { subjectId, materialId, topic, numCards } = req.body;

  const subject = await Subject.findOne({ _id: subjectId, user: req.user!.userId });
  if (!subject) throw notFound('Subject');

  let sourceText = '';
  if (materialId) {
    const material = await getOwnedMaterial(materialId, req.user!.userId);
    sourceText = material.extractedText || '';
  } else {
    const materials = await Material.find({ subject: subject._id, status: 'ready' }).select(
      '+extractedText',
    );
    if (materials.length === 0) {
      throw new AppError('No ready materials found for this subject to generate flashcards from', 400);
    }
    sourceText = materials.map((m) => m.extractedText).join('\n\n').slice(0, 60000);
  }

  const ai = getAIProvider();
  const { system, prompt } = flashcardGenPrompt({ text: sourceText, topic, numCards });
  const result = await ai.completeJSON<{ flashcards: AIFlashcard[] }>({
    system,
    prompt,
    maxTokens: 3000,
  });

  const created = await Flashcard.insertMany(
    result.flashcards.map((f) => ({
      user: req.user!.userId,
      subject: subject._id,
      material: materialId || undefined,
      question: f.question,
      answer: f.answer,
      topic: f.topic,
      difficulty: f.difficulty,
      nextReviewAt: new Date(),
    })),
  );

  res.status(201).json({ success: true, data: created });
});

export const generateStudyPlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { range } = req.body;
  const userId = new Types.ObjectId(req.user!.userId);

  const topicStats = await computeTopicStats(userId);
  const { weak, strong } = splitWeakStrong(topicStats);

  const subjects = await Subject.find({ user: userId }).lean();
  if (subjects.length === 0) {
    throw new AppError('Add a subject before generating a study plan', 400);
  }
  const subjectByName = new Map(subjects.map((s) => [s.name, s._id]));

  const recentAttempts = await QuizAttempt.find({ user: userId })
    .sort({ submittedAt: -1 })
    .limit(5)
    .lean();
  const recentQuizSummaries = recentAttempts.map(
    (a) => `Scored ${a.percentage}% on a quiz (${a.correctCount}/${a.totalQuestions} correct)`,
  );

  const userDoc = await User.findById(userId);

  const ai = getAIProvider();
  const { system, prompt } = studyPlanPrompt({
    range,
    weakTopics: weak.map((w) => ({ subject: w.subject, topic: w.topic, percentage: w.percentage })),
    strongTopics: strong.map((s) => ({ subject: s.subject, topic: s.topic, percentage: s.percentage })),
    recentQuizSummaries,
    dailyGoalMinutes: userDoc?.dailyGoalMinutes ?? 60,
  });

  const result = await ai.completeJSON<{
    tasks: {
      subjectName: string;
      topic: string;
      durationMinutes: number;
      reason: string;
      priority: number;
    }[];
  }>({ system, prompt, maxTokens: 2500 });

  const tasks = result.tasks
    .filter((t) => subjectByName.has(t.subjectName))
    .map((t) => ({
      subject: subjectByName.get(t.subjectName),
      topic: t.topic,
      durationMinutes: t.durationMinutes,
      reason: t.reason,
      priority: t.priority,
      completed: false,
    }));

  const plan = await StudyPlan.create({
    user: userId,
    range,
    forDate: new Date(),
    tasks,
    generatedFrom: {
      weakTopics: weak.map((w) => w.topic),
      strongTopics: strong.map((s) => s.topic),
    },
  });

  res.status(201).json({ success: true, data: plan });
});

export const analyzePerformance = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = new Types.ObjectId(req.user!.userId);

  const topicStats = await computeTopicStats(userId);
  const { weak } = splitWeakStrong(topicStats);
  const improvements = await computeImprovements(userId);
  const strugglingStreaks = await computeStrugglingStreaks(userId);

  if (weak.length === 0 && improvements.length === 0 && strugglingStreaks.length === 0) {
    return res.json({
      success: true,
      data: { recommendations: ['Take a few quizzes to unlock personalized recommendations.'] },
    });
  }

  const ai = getAIProvider();
  const { system, prompt } = recommendationsPrompt({
    weakTopics: weak.map((w) => ({ subject: w.subject, topic: w.topic, percentage: w.percentage })),
    improvements,
    strugglingStreaks,
  });
  const result = await ai.completeJSON<{ recommendations: string[] }>({ system, prompt, maxTokens: 1200 });

  res.json({ success: true, data: result });
});
