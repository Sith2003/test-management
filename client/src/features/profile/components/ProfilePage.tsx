'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useUpdateProfile, useChangePassword } from '../hooks/useProfile';
import { useAuthStore } from '@/shared/stores/authStore';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // Profile form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  // Sync name when user changes in store
  useEffect(() => {
    resetProfile({ name: user?.name ?? '' });
  }, [user?.name, resetProfile]);

  // Password form
  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate({ name: values.name });
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => resetPassword() }
    );
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account settings"
      />

      <div className="px-8 py-6 max-w-2xl space-y-6">
        {/* ── Profile card ── */}
        <Card title="Profile">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Your display name"
                error={profileErrors.name?.message}
                {...regProfile('name')}
              />

              <Input
                label="Email"
                value={user?.email ?? ''}
                readOnly
                disabled
                helpText="Email address cannot be changed."
              />

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateProfile.isPending}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* ── Change Password card ── */}
        <Card title="Change Password">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                error={passwordErrors.currentPassword?.message}
                {...regPassword('currentPassword')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                error={passwordErrors.newPassword?.message}
                {...regPassword('newPassword')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                autoComplete="new-password"
                error={passwordErrors.confirmNewPassword?.message}
                {...regPassword('confirmNewPassword')}
              />

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={changePassword.isPending}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
