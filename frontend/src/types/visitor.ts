export type VisitorStatus = "IN" | "OUT";

export interface VisitorUnit {
  unitNumber: string;
  floor: { floorNumber: number };
}

export interface VisitorResident {
  id: string;
  user: { firstName: string; lastName: string };
}

export interface VisitorRecordedBy {
  firstName: string;
  lastName: string;
  role: string;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string | null;
  purpose: string | null;
  vehiclePlate: string | null;
  groupSize: number;
  unitId: string;
  unit: VisitorUnit;
  residentId: string | null;
  resident: VisitorResident | null;
  checkInAt: string;
  checkOutAt: string | null;
  recordedById: string;
  recordedBy: VisitorRecordedBy;
  checkedOutById: string | null;
  checkedOutBy: VisitorRecordedBy | null;
  isAutoExpired: boolean;
  createdAt: string;
}

export interface VisitorListResponse {
  data: Visitor[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateVisitorRequest {
  name: string;
  phone?: string;
  purpose?: string;
  vehiclePlate?: string;
  unitId: string;
  residentId?: string;
  groupSize?: number;
}
