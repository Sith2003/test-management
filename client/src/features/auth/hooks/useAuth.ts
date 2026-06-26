'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/shared/stores/authStore';
import type { LoginInput, RegisterInput } from '@/shared/types';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success('Logged in successfully');
      router.push('/projects');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success('Account created successfully');
      router.push('/projects');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Registration failed. Please try again.';
      toast.error(message);
    },
  });
}
