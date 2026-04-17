import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type { Building, UpdateBuildingRequest } from "@/types/building";

export const buildingService = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return api.get<PaginatedResponse<Building>>(`/buildings${qs ? `?${qs}` : ""}`);
  },

  update: (id: string, data: UpdateBuildingRequest) =>
    api.patch<Building>(`/buildings/${id}`, data),
};
