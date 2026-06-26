'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserList } from '@/features/users/components/UserList';
import { useAuthStore } from '@/shared/stores/authStore';
import { UserRole } from '@/shared/types';

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.replace('/projects');
    }
  }, [user, router]);

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return <UserList />;
}
