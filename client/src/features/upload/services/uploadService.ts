import api from '@/shared/services/api';
import type { UploadPreviewResponse } from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export const uploadService = {
  async previewUpload(
    _projectId: string,
    file: File
  ): Promise<UploadPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<never, Wrapped<UploadPreviewResponse>>(
      `/upload/preview`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  async importUpload(
    projectId: string,
    file: File
  ): Promise<{ imported: number; failed: number; total: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    const res = await api.post<never, Wrapped<{ imported: number; failed: number; total: number }>>(
      `/upload/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  getTemplateUrl(_projectId: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    return `${base}/upload/template`;
  },
};
