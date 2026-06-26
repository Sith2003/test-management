'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { testCaseService } from '@/features/test-cases/services/testCaseService';
import type { CreateTestCaseInput, UpdateTestCaseInput, TestCaseFilters } from '@/shared/types';

export const testCaseKeys = {
  all: (projectId: string) => ['testCases', projectId] as const,
  lists: (projectId: string, filters?: TestCaseFilters) =>
    [...testCaseKeys.all(projectId), 'list', filters] as const,
  detail: (projectId: string, caseId: string) =>
    [...testCaseKeys.all(projectId), 'detail', caseId] as const,
  suites: (projectId: string) => ['suites', projectId] as const,
};

export function useTestCases(projectId: string, filters?: TestCaseFilters) {
  return useQuery({
    queryKey: testCaseKeys.lists(projectId, filters),
    queryFn: () => testCaseService.getTestCases(projectId, filters),
    enabled: !!projectId,
  });
}

export function useTestCase(projectId: string, caseId: string) {
  return useQuery({
    queryKey: testCaseKeys.detail(projectId, caseId),
    queryFn: () => testCaseService.getTestCase(projectId, caseId),
    enabled: !!projectId && !!caseId,
  });
}

export function useSuites(projectId: string) {
  return useQuery({
    queryKey: testCaseKeys.suites(projectId),
    queryFn: () => testCaseService.getSuites(projectId),
    enabled: !!projectId,
  });
}

export function useTestCaseScenarios(projectId: string) {
  return useQuery({
    queryKey: [...testCaseKeys.all(projectId), 'scenarios'] as const,
    queryFn: () => testCaseService.getScenarios(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTestCase(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestCaseInput) =>
      testCaseService.createTestCase(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      toast.success('Test case created');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to create test case';
      toast.error(message);
    },
  });
}

export function useUpdateTestCase(projectId: string, caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestCaseInput) =>
      testCaseService.updateTestCase(projectId, caseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      queryClient.invalidateQueries({
        queryKey: testCaseKeys.detail(projectId, caseId),
      });
      toast.success('Test case updated');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to update test case';
      toast.error(message);
    },
  });
}

export function useDeleteTestCase(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) =>
      testCaseService.deleteTestCase(projectId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      toast.success('Test case deleted');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to delete test case';
      toast.error(message);
    },
  });
}

export function useCreateSuite(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; parentId?: string }) =>
      testCaseService.createSuite(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.suites(projectId) });
      toast.success('Suite created');
    },
    onError: () => {
      toast.error('Failed to create suite');
    },
  });
}

export function useDeleteSuite(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suiteId: string) => testCaseService.deleteSuite(projectId, suiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.suites(projectId) });
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      toast.success('Suite deleted');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to delete suite';
      toast.error(message);
    },
  });
}

export function useBulkUpdateTestCases(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      ids: string[];
      action: 'move' | 'setStatus' | 'delete';
      suiteId?: string;
      status?: string;
    }) => testCaseService.bulkUpdate(projectId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      toast.success(`${result.affected} test case${result.affected !== 1 ? 's' : ''} updated`);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Bulk operation failed';
      toast.error(message);
    },
  });
}

export function useReviewTestCase(projectId: string, caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: string; comment?: string }) =>
      testCaseService.reviewTestCase(projectId, caseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: testCaseKeys.detail(projectId, caseId) });
      toast.success('Review status updated');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to update review status';
      toast.error(message);
    },
  });
}

export function useReorderSuites(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { suiteId: string; order: number }[]) =>
      testCaseService.reorderSuites(projectId, orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.suites(projectId) });
    },
    onError: () => {
      toast.error('Failed to reorder suites');
    },
  });
}

export function useTestCaseTags(projectId: string) {
  return useQuery({
    queryKey: ['testCaseTags', projectId],
    queryFn: () => testCaseService.getTags(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useTestCaseComments(projectId: string, caseId: string) {
  return useQuery({
    queryKey: ['testCaseComments', projectId, caseId],
    queryFn: () => testCaseService.getComments(projectId, caseId),
    enabled: !!projectId && !!caseId,
  });
}

export function useAddTestCaseComment(projectId: string, caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => testCaseService.addComment(projectId, caseId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCaseComments', projectId, caseId] });
    },
    onError: () => toast.error('Failed to add comment'),
  });
}

export function useDeleteTestCaseComment(projectId: string, caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => testCaseService.deleteComment(projectId, caseId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCaseComments', projectId, caseId] });
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}
