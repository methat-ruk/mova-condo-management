import type { LucideIcon } from "lucide-react";

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}

// ─── Common ──────────────────────────────────────────────────────────────────

export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "JURISTIC" | "STAFF" | "GUARD" | "RESIDENT";

export type OccupancyStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export type ResidentType = "OWNER" | "TENANT";
