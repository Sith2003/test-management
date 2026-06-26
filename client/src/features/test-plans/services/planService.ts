import api from '@/shared/services/api';
import type { TestPlan, CreateTestPlanInput, UpdateTestPlanInput } from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export const planService = {
  async getAll(projectId: string): Promise<{ data: TestPlan[] }> {
    const res = await api.get<never, Wrapped<{ data: TestPlan[] }>>(
      `/projects/${projectId}/plans`
    );
    return res.data;
  },

  async getOne(projectId: string, planId: string): Promise<TestPlan> {
    const res = await api.get<never, Wrapped<TestPlan>>(
      `/projects/${projectId}/plans/${planId}`
    );
    return res.data;
  },

  async create(projectId: string, input: CreateTestPlanInput): Promise<TestPlan> {
    const res = await api.post<never, Wrapped<TestPlan>>(
      `/projects/${projectId}/plans`, input
    );
    return res.data;
  },

  async update(projectId: string, planId: string, input: UpdateTestPlanInput): Promise<TestPlan> {
    const res = await api.patch<never, Wrapped<TestPlan>>(
      `/projects/${projectId}/plans/${planId}`, input
    );
    return res.data;
  },

  async remove(projectId: string, planId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/plans/${planId}`);
  },

  async linkRun(projectId: string, planId: string, runId: string): Promise<void> {
    await api.post(`/projects/${projectId}/plans/${planId}/runs/${runId}`);
  },

  async unlinkRun(projectId: string, planId: string, runId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/plans/${planId}/runs/${runId}`);
  },
};
