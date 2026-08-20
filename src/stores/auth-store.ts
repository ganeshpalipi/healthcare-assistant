import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  let user: User | null = null;
  if (token) {
    try {
      user = JSON.parse(atob(token));
    } catch {
      localStorage.removeItem('auth_token');
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!user,
    setAuth: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
    updateUser: (data) =>
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...data };
        if (state.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', btoa(JSON.stringify(updated)));
        }
        return { user: updated };
      }),
  };
});
