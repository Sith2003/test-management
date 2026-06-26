import api from '@/shared/services/api';
import type {
  Requirement,
  RequirementDocument,
  RequirementCoverage,
  CreateRequirementInput,
  CollectionResponse,
  Pagination,
} from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination; meta: { timestamp: string }; }

export const requirementService = {
  async getRequirements(projectId: string, params?: Record<string, string>): Promise<CollectionResponse<Requirement>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<never, PaginatedResponse<Requirement>>(`/projects/${projectId}/requirements${query}`);
  },

  async getRequirement(projectId: string, requirementId: string): Promise<Requirement> {
    const res = await api.get<never, Wrapped<Requirement>>(
      `/projects/${projectId}/requirements/${requirementId}`
    );
    return res.data;
  },

  async createRequirement(projectId: string, input: CreateRequirementInput): Promise<Requirement> {
    const res = await api.post<never, Wrapped<Requirement>>(
      `/projects/${projectId}/requirements`,
      input
    );
    return res.data;
  },

  async updateRequirement(
    projectId: string,
    requirementId: string,
    input: Partial<CreateRequirementInput>
  ): Promise<Requirement> {
    const res = await api.patch<never, Wrapped<Requirement>>(
      `/projects/${projectId}/requirements/${requirementId}`,
      input
    );
    return res.data;
  },

  async deleteRequirement(projectId: string, requirementId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/requirements/${requirementId}`);
  },

  async linkTestCase(projectId: string, requirementId: string, testCaseId: string): Promise<void> {
    await api.post(`/projects/${projectId}/requirements/${requirementId}/link`, { testCaseId });
  },

  async unlinkTestCase(
    projectId: string,
    requirementId: string,
    caseId: string
  ): Promise<void> {
    await api.delete(`/projects/${projectId}/requirements/${requirementId}/link/${caseId}`);
  },

  async getCoverage(projectId: string): Promise<RequirementCoverage> {
    const res = await api.get<never, Wrapped<RequirementCoverage>>(
      `/projects/${projectId}/requirements/coverage`
    );
    return res.data;
  },

  async getTraceability(projectId: string): Promise<TraceabilityData> {
    const res = await api.get<never, Wrapped<TraceabilityData>>(
      `/projects/${projectId}/requirements/traceability`
    );
    return res.data;
  },

  async getDocuments(projectId: string, requirementId: string): Promise<RequirementDocument[]> {
    const res = await api.get<never, Wrapped<RequirementDocument[]>>(
      `/projects/${projectId}/requirements/${requirementId}/documents`
    );
    return res.data;
  },

  async uploadDocument(projectId: string, requirementId: string, file: File): Promise<RequirementDocument> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<never, Wrapped<RequirementDocument>>(
      `/projects/${projectId}/requirements/${requirementId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data;
  },

  async deleteDocument(projectId: string, requirementId: string, documentId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/requirements/${requirementId}/documents/${documentId}`);
  },
};

export interface TraceabilityTestCase {
  id: string;
  caseId: string;
  title: string;
  lastExecutionStatus: string | null;
  openDefects: number;
}

export interface TraceabilityRow {
  id: string;
  reqId: string;
  title: string;
  priority: string;
  externalId: string | null;
  testCases: TraceabilityTestCase[];
  summary: { total: number; pass: number; fail: number; blocked: number; untested: number };
  openDefects: number;
  rowStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export interface TraceabilityData {
  rows: TraceabilityRow[];
  stats: { total: number; green: number; yellow: number; red: number };
}
