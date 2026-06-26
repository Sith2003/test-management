'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { requirementService } from '../services/requirementService';
import type { CreateRequirementInput } from '@/shared/types';
export type { TraceabilityData, TraceabilityRow } from '../services/requirementService';

export const requirementKeys = {
  all: (projectId: string) => ['requirements', projectId] as const,
  lists: (projectId: string) => [...requirementKeys.all(projectId), 'list'] as const,
  detail: (projectId: string, id: string) => [...requirementKeys.all(projectId), 'detail', id] as const,
  coverage: (projectId: string) => [...requirementKeys.all(projectId), 'coverage'] as const,
  traceability: (projectId: string) => [...requirementKeys.all(projectId), 'traceability'] as const,
};

export function useRequirements(projectId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: [...requirementKeys.lists(projectId), params],
    queryFn: () => requirementService.getRequirements(projectId, params),
    enabled: !!projectId,
  });
}

export function useRequirement(projectId: string, requirementId: string) {
  return useQuery({
    queryKey: requirementKeys.detail(projectId, requirementId),
    queryFn: () => requirementService.getRequirement(projectId, requirementId),
    enabled: !!projectId && !!requirementId,
  });
}

export function useRequirementCoverage(projectId: string) {
  return useQuery({
    queryKey: requirementKeys.coverage(projectId),
    queryFn: () => requirementService.getCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useCreateRequirement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRequirementInput) =>
      requirementService.createRequirement(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementKeys.all(projectId) });
      toast.success('Requirement created');
    },
    onError: () => toast.error('Failed to create requirement'),
  });
}

export function useUpdateRequirement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateRequirementInput> }) =>
      requirementService.updateRequirement(projectId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementKeys.all(projectId) });
      toast.success('Requirement updated');
    },
    onError: () => toast.error('Failed to update requirement'),
  });
}

export function useDeleteRequirement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requirementService.deleteRequirement(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementKeys.all(projectId) });
      toast.success('Requirement deleted');
    },
    onError: () => toast.error('Failed to delete requirement'),
  });
}

export function useLinkTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, testCaseId }: { requirementId: string; testCaseId: string }) =>
      requirementService.linkTestCase(projectId, requirementId, testCaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementKeys.all(projectId) });
      toast.success('Test case linked');
    },
    onError: () => toast.error('Failed to link test case'),
  });
}

export function useTraceability(projectId: string) {
  return useQuery({
    queryKey: requirementKeys.traceability(projectId),
    queryFn: () => requirementService.getTraceability(projectId),
    enabled: !!projectId,
  });
}

export function useUnlinkTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, caseId }: { requirementId: string; caseId: string }) =>
      requirementService.unlinkTestCase(projectId, requirementId, caseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementKeys.all(projectId) });
      toast.success('Test case unlinked');
    },
    onError: () => toast.error('Failed to unlink test case'),
  });
}

export const documentKeys = {
  list: (projectId: string, requirementId: string) =>
    ['req-docs', projectId, requirementId] as const,
};

export function useRequirementDocuments(projectId: string, requirementId: string) {
  return useQuery({
    queryKey: documentKeys.list(projectId, requirementId),
    queryFn: () => requirementService.getDocuments(projectId, requirementId),
    enabled: !!projectId && !!requirementId,
  });
}

export function useUploadDocument(projectId: string, requirementId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => requirementService.uploadDocument(projectId, requirementId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(projectId, requirementId) });
      toast.success('Document uploaded');
    },
    onError: () => toast.error('Failed to upload document'),
  });
}

export function useDeleteDocument(projectId: string, requirementId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      requirementService.deleteDocument(projectId, requirementId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(projectId, requirementId) });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });
}
