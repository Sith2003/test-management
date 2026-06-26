import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      _hasHydrated: false,
      setAuth: (user: User, accessToken: string) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
