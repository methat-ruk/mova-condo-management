import { api } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginRequest } from "@/types/auth";

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post<void>("/auth/logout"),

  getProfile: () => api.get<AuthUser>("/auth/profile"),
};
