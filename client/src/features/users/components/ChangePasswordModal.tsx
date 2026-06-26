'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useResetUserPassword } from '../hooks/useUsers';
import type { User } from '@/shared/types';

const schema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ user, isOpen, onClose }: Props) {
  const resetPassword = useResetUserPassword();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '123456' },
  });

  const onSubmit = (values: FormValues) => {
    resetPassword.mutate({ userId: user.id, newPassword: values.newPassword }, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Change Password — ${user.name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password *"
          type="text"
          helpText="User will use this password to log in"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={resetPassword.isPending}>
            Save Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
