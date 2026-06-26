import api from '@/shared/services/api';
import type { AdhocCase, CreateAdhocInput, CollectionResponse, Pagination, Defect } from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination; meta: { timestamp: string }; }

export const adhocService = {
  async getAdhocCases(projectId: string, page = 1, limit = 20): Promise<CollectionResponse<AdhocCase>> {
    return api.get<never, PaginatedResponse<AdhocCase>>(`/projects/${projectId}/adhoc?page=${page}&limit=${limit}`);
  },
  async getAdhocCase(projectId: string, adhocId: string): Promise<AdhocCase> {
    const res = await api.get<never, Wrapped<AdhocCase>>(`/projects/${projectId}/adhoc/${adhocId}`);
    return res.data;
  },
  async createAdhocCase(projectId: string, input: CreateAdhocInput): Promise<AdhocCase> {
    const res = await api.post<never, Wrapped<AdhocCase>>(`/projects/${projectId}/adhoc`, input);
    return res.data;
  },
  async updateAdhocCase(projectId: string, adhocId: string, input: Record<string, unknown>): Promise<AdhocCase> {
    const res = await api.patch<never, Wrapped<AdhocCase>>(`/projects/${projectId}/adhoc/${adhocId}`, input);
    return res.data;
  },
  async convertToTc(projectId: string, adhocId: string): Promise<{ id: string; caseId: string }> {
    const res = await api.post<never, Wrapped<{ id: string; caseId: string }>>(`/projects/${projectId}/adhoc/${adhocId}/convert`);
    return res.data;
  },
  async deleteAdhocCase(projectId: string, adhocId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/adhoc/${adhocId}`);
  },
  async convertToDefect(projectId: string, adhocId: string): Promise<Defect> {
    const res = await api.post<never, Wrapped<Defect>>(
      `/projects/${projectId}/adhoc/${adhocId}/convert-to-defect`
    );
    return res.data;
  },
};
