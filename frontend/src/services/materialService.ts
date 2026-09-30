import { api } from '../api/client';
import { ApiResponse, Material } from '../types';

export const materialService = {
  list: (subjectId?: string) =>
    api
      .get<ApiResponse<Material[]>>('/materials', { params: subjectId ? { subjectId } : {} })
      .then((r) => r.data.data),

  get: (id: string) => api.get<ApiResponse<Material>>(`/materials/${id}`).then((r) => r.data.data),

  upload: (file: File, subjectId: string, title: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    form.append('subjectId', subjectId);
    form.append('title', title);
    return api
      .post<ApiResponse<Material>>('/materials/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data.data);
  },

  remove: (id: string) => api.delete(`/materials/${id}`),
};
