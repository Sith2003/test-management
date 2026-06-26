'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adhocService } from '../services/adhocService';
import type { CreateAdhocInput } from '@/shared/types';

export const adhocKeys = {
  all: (projectId: string) => ['adhoc', projectId] as const,
  lists: (projectId: string) => [...adhocKeys.all(projectId), 'list'] as const,
  detail: (projectId: string, id: string) => [...adhocKeys.all(projectId), 'detail', id] as const,
};

export function useAdhocCases(projectId: string) {
  return useQuery({ queryKey: adhocKeys.lists(projectId), queryFn: () => adhocService.getAdhocCases(projectId), enabled: !!projectId });
}

export function useAdhocCase(projectId: string, adhocId: string) {
  return useQuery({ queryKey: adhocKeys.detail(projectId, adhocId), queryFn: () => adhocService.getAdhocCase(projectId, adhocId), enabled: !!projectId && !!adhocId });
}

export function useCreateAdhocCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdhocInput) => adhocService.createAdhocCase(projectId, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adhocKeys.all(projectId) }); toast.success('Ad-hoc case submitted'); },
    onError: () => toast.error('Failed to submit ad-hoc case'),
  });
}

export function useUpdateAdhocCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => adhocService.updateAdhocCase(projectId, id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adhocKeys.all(projectId) }); toast.success('Updated'); },
    onError: () => toast.error('Failed to update'),
  });
}

export function useConvertAdhocToTc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adhocId: string) => adhocService.convertToTc(projectId, adhocId),
    onSuccess: (tc) => { qc.invalidateQueries({ queryKey: adhocKeys.all(projectId) }); toast.success(`Converted to test case ${tc.caseId}`); },
    onError: () => toast.error('Failed to convert'),
  });
}

export function useDeleteAdhocCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adhocService.deleteAdhocCase(projectId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adhocKeys.all(projectId) }); toast.success('Ad-hoc case deleted'); },
    onError: () => toast.error('Failed to delete ad-hoc case'),
  });
}

export function useConvertAdhocToDefect(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adhocId: string) => adhocService.convertToDefect(projectId, adhocId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adhocKeys.all(projectId) });
      toast.success('Converted to defect successfully');
    },
    onError: () => toast.error('Failed to convert to defect'),
  });
}
