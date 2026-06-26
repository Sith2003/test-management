import api from '@/shared/services/api';

export const profileService = {
  updateProfile: (input: { name: string }) =>
    api.patch('/auth/profile', input),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/change-password', input),
};
