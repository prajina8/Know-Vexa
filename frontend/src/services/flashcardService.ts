import { api } from '../api/client';
import { ApiResponse, Flashcard } from '../types';

export const flashcardService = {
  list: (params?: { subjectId?: string; dueOnly?: boolean }) =>
    api
      .get<ApiResponse<Flashcard[]>>('/flashcards', {
        params: { subjectId: params?.subjectId, dueOnly: params?.dueOnly ? 'true' : undefined },
      })
      .then((r) => r.data.data),

  rate: (id: string, rating: 'hard' | 'good' | 'easy') =>
    api.put<ApiResponse<Flashcard>>(`/flashcards/${id}/rate`, { rating }).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/flashcards/${id}`),
};
