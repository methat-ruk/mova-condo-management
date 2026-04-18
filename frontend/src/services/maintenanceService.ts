import { api } from "@/lib/api";
import type {
  CreateTicketRequest,
  MaintenanceTicket,
  TicketListResponse,
  UpdateTicketRequest,
} from "@/types/maintenance";

export interface TicketQuery {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const maintenanceService = {
  getAll: (query?: TicketQuery) =>
    api.get<TicketListResponse>("/maintenance", {
      params: query as Record<string, unknown>,
    }),

  getOne: (id: string) => api.get<MaintenanceTicket>(`/maintenance/${id}`),

  create: (data: CreateTicketRequest) => api.post<MaintenanceTicket>("/maintenance", data),

  update: (id: string, data: UpdateTicketRequest) =>
    api.patch<MaintenanceTicket>(`/maintenance/${id}`, data),

  remove: (id: string) => api.delete(`/maintenance/${id}`),
};
