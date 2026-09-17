import { api } from '../api/client';
import { ApiResponse, User } from '../types';

export interface AuthResult {
  token: string;
  user: User;
}

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/login', data).then((r) => r.data.data),

  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  updateProfile: (data: { name?: string; dailyGoalMinutes?: number; avatarUrl?: string }) =>
    api.put<ApiResponse<User>>('/users/profile', data).then((r) => r.data.data),

  achievements: () => api.get<ApiResponse<unknown[]>>('/users/achievements').then((r) => r.data.data),
};
