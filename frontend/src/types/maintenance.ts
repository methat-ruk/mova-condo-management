export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type MaintenanceCategory =
  | "ELECTRICAL"
  | "PLUMBING"
  | "HVAC"
  | "STRUCTURAL"
  | "APPLIANCE"
  | "OTHER";

export interface TicketUnit {
  unitNumber: string;
  floor: { floorNumber: number };
}

export interface TicketResident {
  id: string;
  user: { firstName: string; lastName: string };
}

export interface TicketStaff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TicketReporter {
  firstName: string;
  lastName: string;
  role: string;
}

export interface TicketLogUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TicketLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: TicketLogUser;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  status: MaintenanceStatus;
  note: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  unitId: string;
  unit: TicketUnit;
  residentId: string | null;
  resident: TicketResident | null;
  assignedToId: string | null;
  assignedTo: TicketStaff | null;
  reportedById: string;
  reportedBy: TicketReporter;
  logs?: TicketLog[];
}

export interface TicketListResponse {
  data: MaintenanceTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: MaintenanceCategory;
  unitId: string;
  residentId?: string;
}

export interface UpdateTicketRequest {
  status?: MaintenanceStatus;
  assignedToId?: string | null;
  note?: string;
}
