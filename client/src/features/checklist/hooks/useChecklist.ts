'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { checklistService } from '../services/checklistService';
import type { ChecklistEntryStatus } from '@/shared/types';

export const checklistKeys = {
  items: (projectId: string) => ['checklist-items', projectId] as const,
  sessions: (projectId: string) => ['checklist-sessions', projectId] as const,
  today: (projectId: string) => ['checklist-today', projectId] as const,
  session: (projectId: string, sessionId: string) => ['checklist-session', projectId, sessionId] as const,
};

export function useChecklistItems(projectId: string) {
  return useQuery({ queryKey: checklistKeys.items(projectId), queryFn: () => checklistService.getItems(projectId), enabled: !!projectId });
}

export function useCreateChecklistItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => checklistService.createItem(projectId, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistKeys.items(projectId) });
      toast.success('Item added');
    },
    onError: () => toast.error('Failed to add item'),
  });
}

export function useDeleteChecklistItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => checklistService.deleteItem(projectId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistKeys.items(projectId) });
      toast.success('Item removed');
    },
    onError: () => toast.error('Failed to remove item'),
  });
}

export function useChecklistSessions(projectId: string) {
  return useQuery({ queryKey: checklistKeys.sessions(projectId), queryFn: () => checklistService.getSessions(projectId), enabled: !!projectId });
}

export function useTodayChecklist(projectId: string) {
  return useQuery({ queryKey: checklistKeys.today(projectId), queryFn: () => checklistService.getTodaySession(projectId), enabled: !!projectId });
}

export function useChecklistSession(projectId: string, sessionId: string | null) {
  return useQuery({
    queryKey: checklistKeys.session(projectId, sessionId ?? ''),
    queryFn: () => checklistService.getSession(projectId, sessionId!),
    enabled: !!projectId && !!sessionId,
  });
}

export function useCreateChecklistSession(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => checklistService.createSession(projectId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistKeys.sessions(projectId) });
      qc.invalidateQueries({ queryKey: checklistKeys.today(projectId) });
      toast.success('Checklist created');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Failed to create checklist');
    },
  });
}

export function useDeleteChecklistSession(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => checklistService.deleteSession(projectId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistKeys.sessions(projectId) });
      qc.invalidateQueries({ queryKey: checklistKeys.today(projectId) });
      toast.success('Checklist deleted');
    },
    onError: () => toast.error('Failed to delete checklist'),
  });
}

export function useUpdateChecklistEntry(projectId: string, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, status, notes }: { entryId: string; status: ChecklistEntryStatus; notes?: string }) =>
      checklistService.updateEntry(projectId, sessionId, entryId, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistKeys.today(projectId) });
      qc.invalidateQueries({ queryKey: ['checklist-session', projectId] });
    },
    onError: () => toast.error('Failed to update entry'),
  });
}
