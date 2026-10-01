import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

export type MaterialStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export type SummaryLength = 'short' | 'medium' | 'detailed';

export type FlashcardRating = 'hard' | 'good' | 'easy';

export type PlanRange = 'daily' | 'weekly';

// Centralized, configurable thresholds — change here, not scattered
// across the codebase.
export const THRESHOLDS = {
  WEAK_TOPIC_MAX_PERCENT: 60, // topic mastery below this = weak
  STRONG_TOPIC_MIN_PERCENT: 80, // topic mastery at/above this = strong
  MIN_ATTEMPTS_FOR_TOPIC_STATS: 2, // need this many answers before a topic is scored
  STREAK_GRACE_HOURS: 30, // hours since last session before a streak breaks
  XP_PER_CORRECT_ANSWER: 10,
  XP_PER_QUIZ_COMPLETED: 25,
  XP_PER_FLASHCARD_SESSION: 5,
};

export interface AIQuizQuestion {
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
}

export interface AIFlashcard {
  question: string;
  answer: string;
  topic: string;
  difficulty: Difficulty;
}

export interface AISummaryResult {
  summary: string;
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  importantPoints: string[];
  formulas?: string[];
  examples?: string[];
}
