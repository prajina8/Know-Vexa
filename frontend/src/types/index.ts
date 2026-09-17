export type MaterialStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyMixed = Difficulty | 'mixed';
export type QuestionType = 'mcq' | 'true_false' | 'short_answer';
export type SummaryLength = 'short' | 'medium' | 'detailed';
export type FlashcardRating = 'hard' | 'good' | 'easy';
export type PlanRange = 'daily' | 'weekly';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoalMinutes: number;
  createdAt?: string;
}

export interface Subject {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  materialCount?: number;
  quizCount?: number;
  createdAt: string;
}

export interface Material {
  _id: string;
  subject: string;
  title: string;
  originalFileName: string;
  fileSizeBytes: number;
  status: MaterialStatus;
  failureReason?: string;
  pageCount?: number;
  wordCount?: number;
  topics: string[];
  createdAt: string;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: Difficulty;
  topic: string;
}

export interface Quiz {
  _id: string;
  subject: string;
  material?: string;
  title: string;
  topic?: string;
  difficulty: DifficultyMixed;
  questionTypes: QuestionType[];
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
  createdAt: string;
}

export interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface QuizAttempt {
  _id: string;
  quiz: string | Quiz;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  percentage: number;
  timeTakenSeconds: number;
  topicPerformance: TopicPerformance[];
  submittedAt: string;
}

export interface Flashcard {
  _id: string;
  subject: string;
  material?: string;
  question: string;
  answer: string;
  topic: string;
  difficulty: Difficulty;
  lastRating?: FlashcardRating;
  timesReviewed: number;
  nextReviewAt: string;
}

export interface StudyTask {
  _id: string;
  subject: { _id: string; name: string; color: string } | string;
  topic: string;
  durationMinutes: number;
  reason: string;
  priority: number;
  completed: boolean;
}

export interface StudyPlan {
  _id: string;
  range: PlanRange;
  forDate: string;
  tasks: StudyTask[];
  generatedFrom: { weakTopics: string[]; strongTopics: string[] };
}

export interface DashboardData {
  totalStudyMinutes: number;
  materialCount: number;
  quizzesCompleted: number;
  averageScore: number;
  subjectProgress: {
    subjectId: string;
    name: string;
    color: string;
    averageScore: number;
    quizzesTaken: number;
    materials: number;
  }[];
  recentActivity: { type: string; label: string; percentage: number; date: string }[];
  weakTopics: { subject: string; topic: string; percentage: number }[];
  recommendedTopics: { subject: string; topic: string; percentage: number }[];
  upcomingTasks: StudyTask[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
