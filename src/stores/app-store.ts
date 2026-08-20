import { create } from 'zustand';
import type { User, ChatMessage, PageKey } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initAuth: () => void;

  // Navigation
  currentPage: PageKey;
  setCurrentPage: (page: PageKey) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  isChatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_user', JSON.stringify(user));
      localStorage.setItem('hc_token', token);
    }
    set({ user, token, isAuthenticated: true, currentPage: 'dashboard' });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hc_user');
      localStorage.removeItem('hc_token');
    }
    set({ user: null, token: null, isAuthenticated: false, currentPage: 'landing' });
  },
  initAuth: () => {
    if (typeof window === 'undefined') return;
    const userStr = localStorage.getItem('hc_user');
    const token = localStorage.getItem('hc_token');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, currentPage: 'dashboard' });
      } catch {
        localStorage.removeItem('hc_user');
        localStorage.removeItem('hc_token');
      }
    }
  },

  // Navigation
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  isChatLoading: false,
  setChatLoading: (loading) => set({ isChatLoading: loading }),
}));
