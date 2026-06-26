import api from '@/shared/services/api';
import type { ActivityLog, CollectionResponse } from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  meta: { timestamp: string };
}

export const activityService = {
  async getActivity(
    projectId: string,
    params?: { page?: number; limit?: number; entityType?: string },
  ): Promise<CollectionResponse<ActivityLog>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.entityType) query.set('entityType', params.entityType);
    const url = `/projects/${projectId}/activity${query.toString() ? `?${query}` : ''}`;
    const res = await api.get<never, PaginatedResponse<ActivityLog>>(url);
    return res;
  },
};
