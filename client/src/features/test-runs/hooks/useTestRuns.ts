'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { testRunService } from '@/features/test-runs/services/testRunService';
import type { CreateTestRunInput, UpdateTestResultInput } from '@/shared/types';

export const testRunKeys = {
  all: (projectId: string) => ['testRuns', projectId] as const,
  lists: (projectId: string) => [...testRunKeys.all(projectId), 'list'] as const,
  detail: (projectId: string, runId: string) =>
    [...testRunKeys.all(projectId), 'detail', runId] as const,
  results: (projectId: string, runId: string) =>
    [...testRunKeys.all(projectId), 'results', runId] as const,
};

export function useTestRuns(projectId: string) {
  return useQuery({
    queryKey: testRunKeys.lists(projectId),
    queryFn: () => testRunService.getTestRuns(projectId),
    enabled: !!projectId,
  });
}

export function useTestRun(projectId: string, runId: string) {
  return useQuery({
    queryKey: testRunKeys.detail(projectId, runId),
    queryFn: () => testRunService.getTestRun(projectId, runId),
    enabled: !!projectId && !!runId,
  });
}

export function useTestResults(projectId: string, runId: string) {
  return useQuery({
    queryKey: testRunKeys.results(projectId, runId),
    queryFn: () => testRunService.getTestResults(projectId, runId),
    enabled: !!projectId && !!runId,
  });
}

export function useCreateTestRun(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestRunInput) =>
      testRunService.createTestRun(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testRunKeys.lists(projectId) });
      toast.success('Test run created');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to create test run';
      toast.error(message);
    },
  });
}

export function useUpdateTestResult(projectId: string, runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resultId,
      input,
    }: {
      resultId: string;
      input: UpdateTestResultInput;
    }) => testRunService.updateTestResult(projectId, runId, resultId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: testRunKeys.results(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: testRunKeys.detail(projectId, runId),
      });
    },
    onError: () => {
      toast.error('Failed to update result');
    },
  });
}
