import api from '@/shared/services/api';
import type { Project, ProjectMember, ProjectStats, CreateProjectInput, UpdateProjectInput } from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const res = await api.get<never, Wrapped<Project[]>>('/projects');
    return res.data;
  },

  async getProject(id: string): Promise<Project> {
    const res = await api.get<never, Wrapped<Project>>(`/projects/${id}`);
    return res.data;
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await api.post<never, Wrapped<Project>>('/projects', input);
    return res.data;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const res = await api.patch<never, Wrapped<Project>>(`/projects/${id}`, input);
    return res.data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const res = await api.get<never, Wrapped<ProjectMember[]>>(`/projects/${projectId}/members`);
    return res.data;
  },

  async addProjectMember(projectId: string, input: { email: string; role: string }): Promise<ProjectMember> {
    const res = await api.post<never, Wrapped<ProjectMember>>(`/projects/${projectId}/members`, input);
    return res.data;
  },

  async updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    const res = await api.patch<never, Wrapped<ProjectMember>>(`/projects/${projectId}/members/${userId}`, { role });
    return res.data;
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const res = await api.get(`/projects/${projectId}/reports/summary`) as { data: { summary: ProjectStats } };
    return res.data.summary;
  },
};
