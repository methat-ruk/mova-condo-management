import { api } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginRequest, RefreshResponse } from "@/types/auth";

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post<void>("/auth/logout"),

  refresh: () => api.post<RefreshResponse>("/auth/refresh"),

  getProfile: () => api.get<AuthUser>("/auth/profile"),
};
