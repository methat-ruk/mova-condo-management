import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

const AUTH_COOKIE = "AUTH_TOKEN";

function setCookie(value: string) {
  document.cookie = `${AUTH_COOKIE}=${value}; path=/; SameSite=Lax`;
}

function clearCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

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
        localStorage.setItem("token", token);
        setCookie(token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("token");
        clearCookie();
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
