import { api } from '../api/client';
import { ApiResponse, StudyPlan } from '../types';

export const studyPlanService = {
  latest: (range: 'daily' | 'weekly' = 'daily') =>
    api.get<ApiResponse<StudyPlan | null>>('/study-plans/latest', { params: { range } }).then((r) => r.data.data),

  list: (range?: 'daily' | 'weekly') =>
    api.get<ApiResponse<StudyPlan[]>>('/study-plans', { params: range ? { range } : {} }).then((r) => r.data.data),

  updateTask: (planId: string, taskId: string, data: { completed?: boolean; reschedule?: boolean }) =>
    api.put<ApiResponse<StudyPlan>>(`/study-plans/${planId}/tasks/${taskId}`, data).then((r) => r.data.data),
};
