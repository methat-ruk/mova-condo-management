import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearAccessToken, setAccessToken } from "@/lib/authSession";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        setAccessToken(token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        clearAccessToken();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
