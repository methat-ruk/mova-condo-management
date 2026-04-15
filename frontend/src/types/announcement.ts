export type AnnouncementStatus = "ACTIVE" | "EXPIRED";

export interface AnnouncementAuthor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: AnnouncementStatus;
  expiredAt: string | null;
  createdById: string;
  createdBy: AnnouncementAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  isPinned?: boolean;
  status?: AnnouncementStatus;
  expiredAt?: string;
}

export type UpdateAnnouncementRequest = Partial<CreateAnnouncementRequest>;
