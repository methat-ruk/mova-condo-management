export type ResidentType = "OWNER" | "TENANT";
export type ResidentStatus = "ACTIVE" | "INACTIVE";

export interface ResidentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ResidentUnit {
  id: string;
  unitNumber: string;
  floor: {
    id: string;
    floorNumber: number;
  };
}

export interface FamilyMember {
  id: string;
  residentId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  residentId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentCreatedBy {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Resident {
  id: string;
  userId: string;
  unitId: string;
  residentType: ResidentType;
  status: ResidentStatus;
  moveInDate: string;
  moveOutDate?: string;
  note?: string;
  createdById: string | null;
  createdBy: ResidentCreatedBy | null;
  createdAt: string;
  updatedAt: string;
  user: ResidentUser;
  unit: ResidentUnit;
  familyMembers: FamilyMember[];
  emergencyContacts: EmergencyContact[];
}

export type ResidentListItem = Omit<Resident, "familyMembers" | "emergencyContacts">;

export interface ResidentListResponse {
  data: ResidentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateResidentRequest {
  userId: string;
  unitId: string;
  residentType: ResidentType;
  moveInDate: string;
  note?: string;
}

export interface UpdateResidentRequest {
  residentType?: ResidentType;
  note?: string;
}

export interface MoveOutRequest {
  moveOutDate?: string;
}

export interface CreateFamilyMemberRequest {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
}

export type UpdateFamilyMemberRequest = Partial<CreateFamilyMemberRequest>;

export interface CreateEmergencyContactRequest {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
}

export type UpdateEmergencyContactRequest = Partial<CreateEmergencyContactRequest>;
