import api from '@/shared/services/api';
import type {
  TestCase,
  TestSuite,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  TestCaseFilters,
  CollectionResponse,
  Pagination,
  TestCaseComment,
} from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  meta: { timestamp: string };
}

export const testCaseService = {
  async getTestCases(
    projectId: string,
    filters?: TestCaseFilters
  ): Promise<CollectionResponse<TestCase>> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.suiteId) params.set('suiteId', filters.suiteId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.reviewStatus) params.set('reviewStatus', filters.reviewStatus);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.scenario) params.set('scenario', filters.scenario);
    if (filters?.tag) params.set('tag', filters.tag);

    const query = params.toString();
    const url = `/projects/${projectId}/cases${query ? `?${query}` : ''}`;

    const res = await api.get<never, PaginatedResponse<TestCase>>(url);
    return res;
  },

  async getTestCase(projectId: string, caseId: string): Promise<TestCase> {
    const res = await api.get<never, Wrapped<TestCase>>(
      `/projects/${projectId}/cases/${caseId}`
    );
    return res.data;
  },

  async createTestCase(
    projectId: string,
    input: CreateTestCaseInput
  ): Promise<TestCase> {
    const res = await api.post<never, Wrapped<TestCase>>(
      `/projects/${projectId}/cases`,
      input
    );
    return res.data;
  },

  async updateTestCase(
    projectId: string,
    caseId: string,
    input: UpdateTestCaseInput
  ): Promise<TestCase> {
    const res = await api.patch<never, Wrapped<TestCase>>(
      `/projects/${projectId}/cases/${caseId}`,
      input
    );
    return res.data;
  },

  async deleteTestCase(projectId: string, caseId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/cases/${caseId}`);
  },

  async getScenarios(projectId: string): Promise<string[]> {
    const res = await api.get<never, { data: string[] }>(`/projects/${projectId}/cases/scenarios`);
    return res.data;
  },

  async getTags(projectId: string): Promise<string[]> {
    const res = await api.get<never, { data: string[] }>(`/projects/${projectId}/cases/tags`);
    return res.data;
  },

  async getComments(projectId: string, caseId: string): Promise<TestCaseComment[]> {
    const res = await api.get<never, { data: TestCaseComment[] }>(`/projects/${projectId}/cases/${caseId}/comments`);
    return res.data;
  },

  async addComment(projectId: string, caseId: string, content: string): Promise<TestCaseComment> {
    const res = await api.post<never, { data: TestCaseComment }>(`/projects/${projectId}/cases/${caseId}/comments`, { content });
    return res.data;
  },

  async deleteComment(projectId: string, caseId: string, commentId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/cases/${caseId}/comments/${commentId}`);
  },

  async getSuites(projectId: string): Promise<TestSuite[]> {
    const res = await api.get<never, Wrapped<TestSuite[]>>(
      `/projects/${projectId}/suites`
    );
    return res.data;
  },

  async createSuite(
    projectId: string,
    data: { name: string; description?: string; parentId?: string }
  ): Promise<TestSuite> {
    const res = await api.post<never, Wrapped<TestSuite>>(
      `/projects/${projectId}/suites`,
      data
    );
    return res.data;
  },

  async deleteSuite(projectId: string, suiteId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/suites/${suiteId}`);
  },

  bulkUpdate: async (
    projectId: string,
    payload: { ids: string[]; action: 'move' | 'setStatus' | 'delete'; suiteId?: string; status?: string }
  ): Promise<{ affected: number }> => {
    const res = await api.patch<never, Wrapped<{ affected: number }>>(
      `/projects/${projectId}/cases/bulk`,
      payload
    );
    return res.data;
  },

  reorderSuites: async (
    projectId: string,
    orders: { suiteId: string; order: number }[]
  ): Promise<void> => {
    await api.patch(`/projects/${projectId}/suites/reorder`, { orders });
  },

  reviewTestCase: async (
    projectId: string,
    caseId: string,
    payload: { status: string; comment?: string }
  ): Promise<TestCase> => {
    const res = await api.patch<never, Wrapped<TestCase>>(
      `/projects/${projectId}/cases/${caseId}/review`,
      payload
    );
    return res.data;
  },
};
