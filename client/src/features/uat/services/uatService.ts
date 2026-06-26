import api from '@/shared/services/api';
import type { UatSession, UatResult, CreateUatSessionInput, CollectionResponse, Pagination } from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination; meta: { timestamp: string }; }

export const uatService = {
  async getSessions(projectId: string): Promise<CollectionResponse<UatSession>> {
    return api.get<never, PaginatedResponse<UatSession>>(`/projects/${projectId}/uat`);
  },
  async getSession(projectId: string, sessionId: string): Promise<UatSession> {
    const res = await api.get<never, Wrapped<UatSession>>(`/projects/${projectId}/uat/${sessionId}`);
    return res.data;
  },
  async createSession(projectId: string, input: CreateUatSessionInput): Promise<UatSession> {
    const res = await api.post<never, Wrapped<UatSession>>(`/projects/${projectId}/uat`, input);
    return res.data;
  },
  async addCases(projectId: string, sessionId: string, testCaseIds: string[]): Promise<UatSession> {
    const res = await api.post<never, Wrapped<UatSession>>(`/projects/${projectId}/uat/${sessionId}/cases`, { testCaseIds });
    return res.data;
  },
  async updateResult(projectId: string, sessionId: string, resultId: string, data: { status: string; actualResult?: string; evidenceUrl?: string; comments?: string }): Promise<UatResult> {
    const res = await api.patch<never, Wrapped<UatResult>>(`/projects/${projectId}/uat/${sessionId}/results/${resultId}`, data);
    return res.data;
  },
  async signOff(projectId: string, sessionId: string, decision: 'ACCEPTED' | 'REJECTED', note?: string): Promise<UatSession> {
    const res = await api.post<never, Wrapped<UatSession>>(`/projects/${projectId}/uat/${sessionId}/sign-off`, { decision, note });
    return res.data;
  },
  async deleteSession(projectId: string, sessionId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/uat/${sessionId}`);
  },
};
