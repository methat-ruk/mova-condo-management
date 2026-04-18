import { api } from "@/lib/api";
import type { CreateParcelRequest, Parcel, ParcelListResponse } from "@/types/parcel";

export interface ParcelQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const parcelService = {
  getAll: (query?: ParcelQuery) =>
    api.get<ParcelListResponse>("/parcels", {
      params: query as Record<string, unknown>,
    }),

  getOne: (id: string) => api.get<Parcel>(`/parcels/${id}`),

  create: (data: CreateParcelRequest) => api.post<Parcel>("/parcels", data),

  claim: (id: string) => api.patch<Parcel>(`/parcels/${id}/claim`, {}),
};
