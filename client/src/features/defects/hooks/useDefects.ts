'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { defectService } from '../services/defectService';
import type { CreateDefectInput } from '@/shared/types';

export const defectKeys = {
  all: (projectId: string) => ['defects', projectId] as const,
  lists: (projectId: string) => [...defectKeys.all(projectId), 'list'] as const,
  byTestCase: (projectId: string, testCaseId: string) =>
    [...defectKeys.all(projectId), 'byTestCase', testCaseId] as const,
  detail: (projectId: string, id: string) => [...defectKeys.all(projectId), 'detail', id] as const,
  comments: (projectId: string, defectId: string) =>
    [...defectKeys.all(projectId), 'comments', defectId] as const,
};

export function useDefects(projectId: string) {
  return useQuery({ queryKey: defectKeys.lists(projectId), queryFn: () => defectService.getDefects(projectId), enabled: !!projectId });
}

export function useDefectsByTestCase(projectId: string, testCaseId: string) {
  return useQuery({
    queryKey: defectKeys.byTestCase(projectId, testCaseId),
    queryFn: () => defectService.getDefectsByTestCase(projectId, testCaseId),
    enabled: !!projectId && !!testCaseId,
  });
}

export function useDefect(projectId: string, defectId: string) {
  return useQuery({ queryKey: defectKeys.detail(projectId, defectId), queryFn: () => defectService.getDefect(projectId, defectId), enabled: !!projectId && !!defectId });
}

export function useCreateDefect(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDefectInput) => defectService.createDefect(projectId, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: defectKeys.all(projectId) }); toast.success('Defect created'); },
    onError: () => toast.error('Failed to create defect'),
  });
}

export function useUpdateDefect(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => defectService.updateDefect(projectId, id, input as never),
    onSuccess: () => { qc.invalidateQueries({ queryKey: defectKeys.all(projectId) }); toast.success('Defect updated'); },
    onError: () => toast.error('Failed to update defect'),
  });
}

export function useDeleteDefect(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectService.deleteDefect(projectId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: defectKeys.all(projectId) }); toast.success('Defect deleted'); },
    onError: () => toast.error('Failed to delete defect'),
  });
}

export function useDefectComments(projectId: string, defectId: string) {
  return useQuery({
    queryKey: defectKeys.comments(projectId, defectId),
    queryFn: () => defectService.getComments(projectId, defectId),
    enabled: !!projectId && !!defectId,
  });
}

export function useAddDefectComment(projectId: string, defectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => defectService.addComment(projectId, defectId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: defectKeys.comments(projectId, defectId) });
      toast.success('Comment posted');
    },
    onError: () => toast.error('Failed to post comment'),
  });
}

export function useDeleteDefectComment(projectId: string, defectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => defectService.deleteComment(projectId, defectId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: defectKeys.comments(projectId, defectId) });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}
