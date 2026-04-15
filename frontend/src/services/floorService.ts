import { api } from "@/lib/api";
import type { CreateFloorRequest, Floor } from "@/types/building";

export const floorService = {
  getByBuilding: (buildingId: string) => api.get<Floor[]>(`/buildings/${buildingId}/floors`),

  getOne: (id: string) => api.get<Floor>(`/floors/${id}`),

  create: (buildingId: string, data: CreateFloorRequest) =>
    api.post<Floor>(`/buildings/${buildingId}/floors`, data),

  remove: (id: string) => api.delete<void>(`/floors/${id}`),
};
