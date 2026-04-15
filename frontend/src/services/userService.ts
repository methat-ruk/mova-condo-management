import { api } from "@/lib/api";
import type { UserRole } from "@/types/auth";

export interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export const userService = {
  getAll: () => api.get<UserOption[]>("/auth/users"),
};
