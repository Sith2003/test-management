'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileService } from '../services/profileService';
import { useAuthStore } from '@/shared/stores/authStore';

export function useUpdateProfile() {
  const { user, setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (input: { name: string }) => profileService.updateProfile(input),
    onSuccess: (_data, variables) => {
      // Update the name in the auth store while keeping the existing token
      if (user) {
        const accessToken = useAuthStore.getState().accessToken ?? '';
        setAuth({ ...user, name: variables.name }, accessToken);
      }
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      profileService.changePassword(input),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: () => toast.error('Failed to change password'),
  });
}
