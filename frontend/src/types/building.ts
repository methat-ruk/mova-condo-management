export type OccupancyStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface Building {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { floors: number };
  floors?: Floor[];
}

export interface Floor {
  id: string;
  floorNumber: number;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { units: number };
  units?: Unit[];
}

export interface Unit {
  id: string;
  unitNumber: string;
  floorId: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  occupancyStatus: OccupancyStatus;
  monthlyRent: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingRequest {
  name: string;
  address: string;
  totalFloors: number;
  description?: string;
  isActive?: boolean;
}

export type UpdateBuildingRequest = Partial<CreateBuildingRequest>;

export interface CreateFloorRequest {
  floorNumber: number;
}

export interface CreateUnitRequest {
  unitNumber: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  occupancyStatus?: OccupancyStatus;
  monthlyRent: number;
}

export type UpdateUnitRequest = Partial<CreateUnitRequest>;
