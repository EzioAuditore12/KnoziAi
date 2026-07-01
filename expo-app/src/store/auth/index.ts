import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '../storage';
import type { AuthStore } from './type';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,

      setUserDetails(data) {
        set({ user: data });
      },

      setUserTokens(data) {
        set({ tokens: data });
      },

      logout: async () => {
        set({ user: null, tokens: null });
      },
    }),
    {
      name: 'knozi-ai-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
