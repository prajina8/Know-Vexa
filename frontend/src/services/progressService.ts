import { api } from '../api/client';
import { ApiResponse, DashboardData } from '../types';

export const progressService = {
  dashboard: () => api.get<ApiResponse<DashboardData>>('/progress/dashboard').then((r) => r.data.data),

  overall: () => api.get<ApiResponse<unknown>>('/progress').then((r) => r.data.data),

  subject: (id: string) => api.get<ApiResponse<unknown>>(`/progress/subjects/${id}`).then((r) => r.data.data),
};
