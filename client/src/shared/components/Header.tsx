'use client';

import Link from 'next/link';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/shared/stores/authStore';
import api from '@/shared/services/api';
import { NotificationBell } from '@/features/notifications/components/NotificationPanel';

export function Header() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  return (
    <header className="shrink-0 px-6 py-3 bg-gray-50 print:hidden">
      <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(165,163,174,0.3)] flex items-center justify-end px-5 h-[56px] gap-3">
        <NotificationBell />

        <div className="w-px h-5 bg-gray-200" />

        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-[13px] font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">
              {user?.name}
            </p>
            <p className="text-[11px] text-gray-500">{user?.role}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
