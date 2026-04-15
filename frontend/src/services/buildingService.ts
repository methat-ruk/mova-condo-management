import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type { Building, CreateBuildingRequest, UpdateBuildingRequest } from "@/types/building";

export const buildingService = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return api.get<PaginatedResponse<Building>>(`/buildings${qs ? `?${qs}` : ""}`);
  },

  getOne: (id: string) => api.get<Building>(`/buildings/${id}`),

  create: (data: CreateBuildingRequest) => api.post<Building>("/buildings", data),

  update: (id: string, data: UpdateBuildingRequest) =>
    api.patch<Building>(`/buildings/${id}`, data),

  remove: (id: string) => api.delete<void>(`/buildings/${id}`),
};
