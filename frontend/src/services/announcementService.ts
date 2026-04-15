import { api } from "@/lib/api";
import type {
  Announcement,
  AnnouncementListResponse,
  AnnouncementStatus,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "@/types/announcement";

export const announcementService = {
  getAll: (params?: {
    search?: string;
    status?: AnnouncementStatus | "VISIBLE";
    page?: number;
    limit?: number;
  }) => api.get<AnnouncementListResponse>("/announcements", { params: params as Record<string, unknown> }),

  getOne: (id: string) => api.get<Announcement>(`/announcements/${id}`),

  getUnreadCount: () => api.get<{ unread: number }>("/announcements/unread"),

  markRead: (id: string) => api.post<void>(`/announcements/${id}/read`),

  create: (data: CreateAnnouncementRequest) => api.post<Announcement>("/announcements", data),

  update: (id: string, data: UpdateAnnouncementRequest) =>
    api.patch<Announcement>(`/announcements/${id}`, data),

  remove: (id: string) => api.delete<void>(`/announcements/${id}`),
};
