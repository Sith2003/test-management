'use client';

import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activityService';

export const activityKeys = {
  all: (projectId: string) => ['activity', projectId] as const,
  list: (projectId: string, entityType?: string) =>
    [...activityKeys.all(projectId), entityType ?? 'all'] as const,
};

export function useActivity(
  projectId: string,
  options?: { limit?: number; entityType?: string },
) {
  return useQuery({
    queryKey: activityKeys.list(projectId, options?.entityType),
    queryFn: () =>
      activityService.getActivity(projectId, {
        limit: options?.limit ?? 50,
        entityType: options?.entityType,
      }),
    enabled: !!projectId,
  });
}
