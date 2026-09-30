import { api } from '../api/client';
import { ApiResponse, Quiz, Flashcard, StudyPlan } from '../types';

export const aiService = {
  summarize: (materialId: string, length: 'short' | 'medium' | 'detailed') =>
    api.post<ApiResponse<unknown>>('/ai/summarize', { materialId, length }).then((r) => r.data.data),

  chat: (materialId: string, message: string) =>
    api
      .post<ApiResponse<{ answer: string; usedContext: boolean }>>('/ai/chat', { materialId, message })
      .then((r) => r.data.data),

  chatHistory: (materialId: string) =>
    api
      .get<ApiResponse<{ role: string; content: string; createdAt: string }[]>>(`/ai/chat/${materialId}`)
      .then((r) => r.data.data),

  clearChat: (materialId: string) => api.delete(`/ai/chat/${materialId}`),

  generateQuiz: (data: {
    subjectId: string;
    materialId?: string;
    topic?: string;
    numQuestions: number;
    difficulty: string;
    questionTypes: string[];
    timeLimitMinutes?: number;
  }) => api.post<ApiResponse<Quiz>>('/ai/generate-quiz', data).then((r) => r.data.data),

  generateFlashcards: (data: { subjectId: string; materialId?: string; topic?: string; numCards: number }) =>
    api.post<ApiResponse<Flashcard[]>>('/ai/generate-flashcards', data).then((r) => r.data.data),

  generateStudyPlan: (range: 'daily' | 'weekly') =>
    api.post<ApiResponse<StudyPlan>>('/ai/generate-study-plan', { range }).then((r) => r.data.data),

  analyzePerformance: () =>
    api.post<ApiResponse<{ recommendations: string[] }>>('/ai/analyze-performance').then((r) => r.data.data),
};
