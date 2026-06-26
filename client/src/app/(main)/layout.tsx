'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/authStore';
import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !user) router.replace('/login');
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated) return null;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
