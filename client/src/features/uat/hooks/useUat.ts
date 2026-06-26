'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uatService } from '../services/uatService';
import type { CreateUatSessionInput } from '@/shared/types';

export const uatKeys = {
  all: (projectId: string) => ['uat', projectId] as const,
  lists: (projectId: string) => [...uatKeys.all(projectId), 'list'] as const,
  detail: (projectId: string, id: string) => [...uatKeys.all(projectId), 'detail', id] as const,
};

export function useUatSessions(projectId: string) {
  return useQuery({ queryKey: uatKeys.lists(projectId), queryFn: () => uatService.getSessions(projectId), enabled: !!projectId });
}

export function useUatSession(projectId: string, sessionId: string) {
  return useQuery({ queryKey: uatKeys.detail(projectId, sessionId), queryFn: () => uatService.getSession(projectId, sessionId), enabled: !!projectId && !!sessionId });
}

export function useCreateUatSession(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUatSessionInput) => uatService.createSession(projectId, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: uatKeys.all(projectId) }); toast.success('UAT session created'); },
    onError: () => toast.error('Failed to create UAT session'),
  });
}

export function useAddUatCases(projectId: string, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testCaseIds: string[]) => uatService.addCases(projectId, sessionId, testCaseIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: uatKeys.detail(projectId, sessionId) }); toast.success('Cases added'); },
    onError: () => toast.error('Failed to add cases'),
  });
}

export function useUpdateUatResult(projectId: string, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resultId, data }: { resultId: string; data: { status: string; actualResult?: string; evidenceUrl?: string; comments?: string } }) =>
      uatService.updateResult(projectId, sessionId, resultId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: uatKeys.detail(projectId, sessionId) }),
    onError: () => toast.error('Failed to update result'),
  });
}

export function useSignOffUat(projectId: string, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, note }: { decision: 'ACCEPTED' | 'REJECTED'; note?: string }) =>
      uatService.signOff(projectId, sessionId, decision, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: uatKeys.all(projectId) }); toast.success('UAT signed off'); },
    onError: () => toast.error('Failed to sign off'),
  });
}
