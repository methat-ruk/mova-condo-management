export type ParcelStatus = "PENDING" | "CLAIMED";

export interface ParcelUnit {
  unitNumber: string;
  floor: { floorNumber: number };
}

export interface ParcelResident {
  id: string;
  user: { firstName: string; lastName: string };
}

export interface ParcelStaff {
  firstName: string;
  lastName: string;
  role: string;
}

export interface Parcel {
  id: string;
  trackingNumber: string | null;
  carrier: string | null;
  note: string | null;
  status: ParcelStatus;
  unitId: string;
  unit: ParcelUnit;
  residentId: string | null;
  resident: ParcelResident | null;
  receivedAt: string;
  claimedAt: string | null;
  receivedById: string;
  receivedBy: ParcelStaff;
  claimedById: string | null;
  claimedBy: ParcelStaff | null;
  createdAt: string;
}

export interface ParcelListResponse {
  data: Parcel[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateParcelRequest {
  trackingNumber?: string;
  carrier?: string;
  note?: string;
  unitId: string;
  residentId?: string;
}
