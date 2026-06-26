import api from '@/shared/services/api';
import type { ChecklistItem, ChecklistSession, ChecklistEntry, ChecklistEntryStatus } from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }

export const checklistService = {
  async getItems(projectId: string): Promise<ChecklistItem[]> {
    const res = await api.get<never, Wrapped<ChecklistItem[]>>(`/projects/${projectId}/checklist/items`);
    return res.data;
  },
  async createItem(projectId: string, title: string): Promise<ChecklistItem> {
    const res = await api.post<never, Wrapped<ChecklistItem>>(`/projects/${projectId}/checklist/items`, { title });
    return res.data;
  },
  async updateItem(projectId: string, itemId: string, title: string): Promise<ChecklistItem> {
    const res = await api.patch<never, Wrapped<ChecklistItem>>(`/projects/${projectId}/checklist/items/${itemId}`, { title });
    return res.data;
  },
  async deleteItem(projectId: string, itemId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/checklist/items/${itemId}`);
  },
  async getSessions(projectId: string): Promise<ChecklistSession[]> {
    const res = await api.get<never, Wrapped<ChecklistSession[]>>(`/projects/${projectId}/checklist/sessions`);
    return res.data;
  },
  async getTodaySession(projectId: string): Promise<ChecklistSession> {
    const res = await api.get<never, Wrapped<ChecklistSession>>(`/projects/${projectId}/checklist/sessions/today`);
    return res.data;
  },
  async getSession(projectId: string, sessionId: string): Promise<ChecklistSession> {
    const res = await api.get<never, Wrapped<ChecklistSession>>(`/projects/${projectId}/checklist/sessions/${sessionId}`);
    return res.data;
  },
  async createSession(projectId: string, date: string): Promise<ChecklistSession> {
    const res = await api.post<never, Wrapped<ChecklistSession>>(`/projects/${projectId}/checklist/sessions`, { date });
    return res.data;
  },
  async deleteSession(projectId: string, sessionId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/checklist/sessions/${sessionId}`);
  },
  async updateEntry(projectId: string, sessionId: string, entryId: string, status: ChecklistEntryStatus, notes?: string): Promise<ChecklistEntry> {
    const res = await api.patch<never, Wrapped<ChecklistEntry>>(`/projects/${projectId}/checklist/sessions/${sessionId}/entries/${entryId}`, { status, notes });
    return res.data;
  },
};
