import { api } from "@/lib/api";
import type { CreateUnitRequest, Unit, UpdateUnitRequest } from "@/types/building";

export interface UnitWithFloor extends Unit {
  floor: { id: string; floorNumber: number };
}

export const unitService = {
  getAll: () => api.get<UnitWithFloor[]>("/units"),

  getByFloor: (floorId: string) => api.get<Unit[]>(`/floors/${floorId}/units`),

  create: (floorId: string, data: CreateUnitRequest) =>
    api.post<Unit>(`/floors/${floorId}/units`, data),

  update: (id: string, data: UpdateUnitRequest) => api.patch<Unit>(`/units/${id}`, data),

  remove: (id: string) => api.delete<void>(`/units/${id}`),
};
