import api from '@/shared/services/api';
import type {
  TestRun,
  TestResult,
  CreateTestRunInput,
  UpdateTestResultInput,
} from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export const testRunService = {
  async getTestRuns(projectId: string): Promise<TestRun[]> {
    const res = await api.get<never, Wrapped<TestRun[]>>(
      `/projects/${projectId}/runs`
    );
    return res.data;
  },

  async getTestRun(projectId: string, runId: string): Promise<TestRun> {
    const res = await api.get<never, Wrapped<TestRun>>(
      `/projects/${projectId}/runs/${runId}`
    );
    return res.data;
  },

  async createTestRun(
    projectId: string,
    input: CreateTestRunInput
  ): Promise<TestRun> {
    const res = await api.post<never, Wrapped<TestRun>>(
      `/projects/${projectId}/runs`,
      input
    );
    return res.data;
  },

  async updateTestRun(
    projectId: string,
    runId: string,
    data: { status?: string; name?: string; description?: string }
  ): Promise<TestRun> {
    const res = await api.patch<never, Wrapped<TestRun>>(
      `/projects/${projectId}/runs/${runId}`,
      data
    );
    return res.data;
  },

  async getTestResults(projectId: string, runId: string): Promise<TestResult[]> {
    const res = await api.get<never, Wrapped<TestResult[]>>(
      `/projects/${projectId}/runs/${runId}/results`
    );
    return res.data;
  },

  async updateTestResult(
    projectId: string,
    runId: string,
    resultId: string,
    input: UpdateTestResultInput
  ): Promise<TestResult> {
    const res = await api.patch<never, Wrapped<TestResult>>(
      `/projects/${projectId}/runs/${runId}/results/${resultId}`,
      input
    );
    return res.data;
  },
};
