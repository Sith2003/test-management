import api from '@/shared/services/api';
import type { Project, TestRun } from '@/shared/types';
import { projectService } from '@/features/projects/services/projectService';

export interface DashboardStats {
  totalProjects: number;
  totalCases: number;
  totalRuns: number;
  recentRuns: TestRun[];
  projects: Project[];
}

export interface DashboardSummary {
  openDefects: number;
  uatPendingSignOff: number;
  neverRunCases: number;
  myAssignedDefects: number;
}

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const projects = await projectService.getProjects();

    const totalProjects = projects.length;
    const totalCases = projects.reduce((sum, p) => sum + (p._count?.testCases ?? 0), 0);
    const totalRuns = projects.reduce((sum, p) => sum + (p._count?.testRuns ?? 0), 0);

    return { totalProjects, totalCases, totalRuns, recentRuns: [], projects };
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await api.get<never, Wrapped<DashboardSummary>>('/dashboard/summary');
    return res.data;
  },
};
