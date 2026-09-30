import { api } from '../api/client';
import { ApiResponse, Quiz, QuizAttempt } from '../types';

export const quizService = {
  list: (subjectId?: string) =>
    api.get<ApiResponse<Quiz[]>>('/quizzes', { params: subjectId ? { subjectId } : {} }).then((r) => r.data.data),

  get: (id: string) => api.get<ApiResponse<Quiz>>(`/quizzes/${id}`).then((r) => r.data.data),

  submit: (
    id: string,
    data: { answers: { questionId: string; givenAnswer?: string }[]; timeTakenSeconds: number; startedAt: string },
  ) =>
    api
      .post<ApiResponse<{ attempt: QuizAttempt; quiz: Quiz; weakTopics: unknown[] }>>(`/quizzes/${id}/submit`, data)
      .then((r) => r.data.data),

  getAttempt: (id: string) => api.get<ApiResponse<QuizAttempt>>(`/quizzes/attempts/${id}`).then((r) => r.data.data),
};
