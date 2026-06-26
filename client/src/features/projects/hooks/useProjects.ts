'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectService } from '@/features/projects/services/projectService';
import type { CreateProjectInput, UpdateProjectInput } from '@/shared/types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  members: (id: string) => [...projectKeys.all, 'members', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectService.getProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project created successfully');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to create project';
      toast.error(message);
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectService.updateProject(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project updated successfully');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to update project';
      toast.error(message);
    },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: string }) =>
      projectService.addProjectMember(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      toast.success('Member added successfully');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to add member';
      toast.error(message);
    },
  });
}

export function useUpdateProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectService.updateProjectMemberRole(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      toast.success('Member role updated');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to update role';
      toast.error(message);
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectService.removeProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      toast.success('Member removed');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to remove member';
      toast.error(message);
    },
  });
}

export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), 'stats'] as const,
    queryFn: () => projectService.getProjectStats(projectId),
    enabled: !!projectId,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project deleted');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Failed to delete project';
      toast.error(message);
    },
  });
}
