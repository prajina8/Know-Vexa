import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const subjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const summarizeSchema = z.object({
  body: z.object({
    materialId: z.string().min(1),
    length: z.enum(['short', 'medium', 'detailed']).default('medium'),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    materialId: z.string().min(1),
    message: z.string().min(1).max(2000),
  }),
});

export const generateQuizSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1),
    materialId: z.string().optional(),
    topic: z.string().optional(),
    numQuestions: z.number().int().min(1).max(30).default(10),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
    questionTypes: z
      .array(z.enum(['mcq', 'true_false', 'short_answer']))
      .min(1)
      .default(['mcq']),
    timeLimitMinutes: z.number().int().positive().optional(),
  }),
});

export const generateFlashcardsSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1),
    materialId: z.string().optional(),
    topic: z.string().optional(),
    numCards: z.number().int().min(1).max(50).default(15),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string(),
        givenAnswer: z.string().optional(),
      }),
    ),
    timeTakenSeconds: z.number().int().min(0),
    startedAt: z.string(),
  }),
  params: z.object({ id: z.string() }),
});

export const rateFlashcardSchema = z.object({
  body: z.object({ rating: z.enum(['hard', 'good', 'easy']) }),
  params: z.object({ id: z.string() }),
});

export const studyPlanSchema = z.object({
  body: z.object({ range: z.enum(['daily', 'weekly']).default('daily') }),
});

export const taskUpdateSchema = z.object({
  body: z.object({
    completed: z.boolean().optional(),
    reschedule: z.boolean().optional(),
  }),
  params: z.object({ planId: z.string(), taskId: z.string() }),
});
