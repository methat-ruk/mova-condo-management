import { api } from "@/lib/api";
import type { CreateVisitorRequest, Visitor, VisitorListResponse } from "@/types/visitor";

export const visitorService = {
  getAll: (params?: {
    search?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<VisitorListResponse>("/visitors", {
      params: params as Record<string, unknown>,
    }),

  getOne: (id: string) => api.get<Visitor>(`/visitors/${id}`),

  checkIn: (data: CreateVisitorRequest) => api.post<Visitor>("/visitors", data),

  checkOut: (id: string) => api.patch<Visitor>(`/visitors/${id}/checkout`),
};
