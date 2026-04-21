import { api } from "@/lib/api";
import type {
  CreateExpenseRequest,
  CreateTicketRequest,
  MaintenanceExpenseSummary,
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

  getExpenseSummaryByPeriod: (query: {
    periodType: "daily" | "monthly" | "yearly";
    year: number;
    month?: number;
    day?: number;
  }) =>
    api.get<MaintenanceExpenseSummary>("/maintenance/expenses/summary", {
      params: query as Record<string, unknown>,
    }),

  exportExpenseCsv: (query: {
    periodType: "daily" | "monthly" | "yearly";
    year: number;
    month?: number;
    day?: number;
  }) =>
    api.get<{ fileName: string; content: string }>("/maintenance/expenses/export-csv", {
      params: query as Record<string, unknown>,
    }),

  create: (data: CreateTicketRequest) => api.post<MaintenanceTicket>("/maintenance", data),

  update: (id: string, data: UpdateTicketRequest) =>
    api.patch<MaintenanceTicket>(`/maintenance/${id}`, data),

  addExpense: (id: string, data: CreateExpenseRequest) =>
    api.post<MaintenanceTicket>(`/maintenance/${id}/expenses`, data),

  removeExpense: (ticketId: string, expenseId: string) =>
    api.delete<MaintenanceTicket>(`/maintenance/${ticketId}/expenses/${expenseId}`),

  remove: (id: string) => api.delete(`/maintenance/${id}`),
};
