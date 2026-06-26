import api from '@/shared/services/api';
import type { Defect, CreateDefectInput, CollectionResponse, Pagination } from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination; meta: { timestamp: string }; }

export interface DefectComment {
  id: string;
  defectId: string;
  content: string;
  authorId: string;
  author: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const defectService = {
  async getDefects(projectId: string, params?: Record<string, string>): Promise<CollectionResponse<Defect>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<never, PaginatedResponse<Defect>>(`/projects/${projectId}/defects${query}`);
  },

  async getDefectsByTestCase(projectId: string, testCaseId: string): Promise<CollectionResponse<Defect>> {
    return api.get<never, PaginatedResponse<Defect>>(
      `/projects/${projectId}/defects?testCaseId=${testCaseId}&limit=50`
    );
  },
  async getDefect(projectId: string, defectId: string): Promise<Defect> {
    const res = await api.get<never, Wrapped<Defect>>(`/projects/${projectId}/defects/${defectId}`);
    return res.data;
  },
  async createDefect(projectId: string, input: CreateDefectInput): Promise<Defect> {
    const res = await api.post<never, Wrapped<Defect>>(`/projects/${projectId}/defects`, input);
    return res.data;
  },
  async updateDefect(projectId: string, defectId: string, input: Partial<CreateDefectInput> & { status?: string }): Promise<Defect> {
    const res = await api.patch<never, Wrapped<Defect>>(`/projects/${projectId}/defects/${defectId}`, input);
    return res.data;
  },
  async deleteDefect(projectId: string, defectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/defects/${defectId}`);
  },

  // Comments
  async getComments(projectId: string, defectId: string): Promise<DefectComment[]> {
    const res = await api.get<never, Wrapped<DefectComment[]>>(
      `/projects/${projectId}/defects/${defectId}/comments`
    );
    return res.data;
  },
  async addComment(projectId: string, defectId: string, content: string): Promise<DefectComment> {
    const res = await api.post<never, Wrapped<DefectComment>>(
      `/projects/${projectId}/defects/${defectId}/comments`,
      { content }
    );
    return res.data;
  },
  async deleteComment(projectId: string, defectId: string, commentId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/defects/${defectId}/comments/${commentId}`);
  },
};
