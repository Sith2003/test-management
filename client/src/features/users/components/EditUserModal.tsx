'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { useUpdateUser } from '../hooks/useUsers';
import { UserRole } from '@/shared/types';
import type { User } from '@/shared/types';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.QA, label: 'QA' },
  { value: UserRole.VIEWER, label: 'Viewer' },
  { value: UserRole.DEVELOPER, label: 'Developer' },
];

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const updateUser = useUpdateUser();

  const handleClose = () => {
    setRole(user.role);
    onClose();
  };

  const handleSubmit = () => {
    updateUser.mutate(
      { userId: user.id, input: { role } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit User — ${user.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={updateUser.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={updateUser.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Update the role for <span className="font-medium text-gray-900">{user.email}</span>.
          </p>
          <Select
            label="Role"
            value={role}
            options={ROLE_OPTIONS}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />
        </div>
      </div>
    </Modal>
  );
}
