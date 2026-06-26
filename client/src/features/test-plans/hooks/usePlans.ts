'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { planService } from '../services/planService';
import type { CreateTestPlanInput, UpdateTestPlanInput } from '@/shared/types';

export const planKeys = {
  all: (projectId: string) => ['plans', projectId] as const,
  one: (projectId: string, planId: string) => ['plans', projectId, planId] as const,
};

export function usePlans(projectId: string) {
  return useQuery({
    queryKey: planKeys.all(projectId),
    queryFn: () => planService.getAll(projectId),
    enabled: !!projectId,
    select: (res) => res.data,
  });
}

export function usePlan(projectId: string, planId: string) {
  return useQuery({
    queryKey: planKeys.one(projectId, planId),
    queryFn: () => planService.getOne(projectId, planId),
    enabled: !!projectId && !!planId,
  });
}

export function useCreatePlan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestPlanInput) => planService.create(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all(projectId) });
      toast.success('Test plan created');
    },
    onError: () => toast.error('Failed to create test plan'),
  });
}

export function useUpdatePlan(projectId: string, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTestPlanInput) => planService.update(projectId, planId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: planKeys.one(projectId, planId) });
      toast.success('Test plan updated');
    },
    onError: () => toast.error('Failed to update test plan'),
  });
}

export function useDeletePlan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => planService.remove(projectId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all(projectId) });
      toast.success('Test plan deleted');
    },
    onError: () => toast.error('Failed to delete test plan'),
  });
}

export function useLinkRun(projectId: string, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => planService.linkRun(projectId, planId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.one(projectId, planId) });
      toast.success('Run linked to plan');
    },
    onError: () => toast.error('Failed to link run'),
  });
}

export function useUnlinkRun(projectId: string, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => planService.unlinkRun(projectId, planId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.one(projectId, planId) });
      toast.success('Run removed from plan');
    },
    onError: () => toast.error('Failed to unlink run'),
  });
}
