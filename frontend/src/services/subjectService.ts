import { api } from '../api/client';
import { ApiResponse, Subject, Material, Quiz } from '../types';

export const subjectService = {
  list: () => api.get<ApiResponse<Subject[]>>('/subjects').then((r) => r.data.data),

  create: (data: { name: string; description?: string; color?: string }) =>
    api.post<ApiResponse<Subject>>('/subjects', data).then((r) => r.data.data),

  get: (id: string) =>
    api
      .get<
        ApiResponse<{
          subject: Subject;
          materials: Material[];
          quizzes: Quiz[];
          weakTopics: unknown[];
          strongTopics: unknown[];
        }>
      >(`/subjects/${id}`)
      .then((r) => r.data.data),

  update: (id: string, data: Partial<Subject>) =>
    api.put<ApiResponse<Subject>>(`/subjects/${id}`, data).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/subjects/${id}`),
};
