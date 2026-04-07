import { api } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@/types/auth";

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),

  register: (data: RegisterRequest) => api.post<AuthUser>("/auth/register", data),

  logout: () => api.post<void>("/auth/logout"),

  getProfile: () => api.get<AuthUser>("/auth/profile"),
};
