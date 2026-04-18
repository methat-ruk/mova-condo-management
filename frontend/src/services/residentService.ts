import { api } from "@/lib/api";
import type {
  CreateEmergencyContactRequest,
  CreateFamilyMemberRequest,
  CreateResidentRequest,
  EmergencyContact,
  FamilyMember,
  MoveOutRequest,
  Resident,
  ResidentListResponse,
  UpdateEmergencyContactRequest,
  UpdateFamilyMemberRequest,
  UpdateResidentRequest,
} from "@/types/resident";

export interface ResidentQuery {
  status?: string;
  residentType?: string;
  unitId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const residentService = {
  getAll: (query?: ResidentQuery) =>
    api.get<ResidentListResponse>("/residents", {
      params: query as Record<string, unknown>,
    }),

  getOne: (id: string) => api.get<Resident>(`/residents/${id}`),

  create: (data: CreateResidentRequest) => api.post<Resident>("/residents", data),

  update: (id: string, data: UpdateResidentRequest) =>
    api.patch<Resident>(`/residents/${id}`, data),

  remove: (id: string) => api.delete<void>(`/residents/${id}`),

  moveOut: (id: string, data?: MoveOutRequest) =>
    api.patch<Resident>(`/residents/${id}/move-out`, data ?? {}),

  // Family Members
  addFamilyMember: (residentId: string, data: CreateFamilyMemberRequest) =>
    api.post<FamilyMember>(`/residents/${residentId}/family-members`, data),

  updateFamilyMember: (
    residentId: string,
    familyMemberId: string,
    data: UpdateFamilyMemberRequest,
  ) => api.patch<FamilyMember>(`/residents/${residentId}/family-members/${familyMemberId}`, data),

  removeFamilyMember: (residentId: string, familyMemberId: string) =>
    api.delete<void>(`/residents/${residentId}/family-members/${familyMemberId}`),

  // Emergency Contacts
  addEmergencyContact: (residentId: string, data: CreateEmergencyContactRequest) =>
    api.post<EmergencyContact>(`/residents/${residentId}/emergency-contacts`, data),

  updateEmergencyContact: (
    residentId: string,
    contactId: string,
    data: UpdateEmergencyContactRequest,
  ) =>
    api.patch<EmergencyContact>(`/residents/${residentId}/emergency-contacts/${contactId}`, data),

  removeEmergencyContact: (residentId: string, contactId: string) =>
    api.delete<void>(`/residents/${residentId}/emergency-contacts/${contactId}`),
};
