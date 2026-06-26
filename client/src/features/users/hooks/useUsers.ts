'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService, type UpdateUserInput, type CreateUserInput } from '../services/userService';

export const userKeys = {
  all: () => ['users'] as const,
  lists: () => [...userKeys.all(), 'list'] as const,
  list: (params: Record<string, string>) => [...userKeys.lists(), params] as const,
};

export function useUsers(
  page: number = 1,
  search: string = '',
  role: string = '',
  isActive: string = ''
) {
  const params: Record<string, string> = { page: String(page) };
  if (search.trim()) params.search = search.trim();
  if (role) params.role = role;
  if (isActive) params.isActive = isActive;

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getUsers(params),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      userService.updateUser(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.createUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() });
      toast.success('User created');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to create user';
      toast.error(msg);
    },
  });
}

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      userService.resetPassword(userId, newPassword),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() });
      toast.success('Password changed');
    },
    onError: () => toast.error('Failed to change password'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });
}
