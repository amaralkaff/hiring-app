import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/lib/types';

interface AppState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: null,
      setUserRole: (role) => set({ userRole: role }),
    }),
    {
      name: 'hiring-app-storage',
    }
  )
);
