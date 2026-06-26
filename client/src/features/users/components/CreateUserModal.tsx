'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { useCreateUser } from '../hooks/useUsers';
import { UserRole } from '@/shared/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: Props) {
  const createUser = useCreateUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '123456',
      role: UserRole.QA,
    },
  });

  const onSubmit = (values: FormValues) => {
    createUser.mutate(values, {
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. สมชาย ใจดี"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email *"
          type="email"
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password *"
          type="text"
          helpText="Default password is 123456 — user can change it after login"
          error={errors.password?.message}
          {...register('password')}
        />

        <Select
          label="Role *"
          options={[
            { value: UserRole.DEVELOPER, label: 'Developer' },
            { value: UserRole.VIEWER, label: 'Viewer' },
            { value: UserRole.QA, label: 'QA' },
            { value: UserRole.MANAGER, label: 'Manager' },
            { value: UserRole.ADMIN, label: 'Admin' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createUser.isPending}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}
