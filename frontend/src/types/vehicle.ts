export type VehicleType =
  | "TWO_WHEELER"
  | "CAR"
  | "COMMERCIAL"
  | "BICYCLE"
  | "OTHER";

export type VehicleStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "ARCHIVED";

export type VehicleMovementType =
  | "ENTRY"
  | "EXIT";

export interface VehicleMovement {
  id: string;
  vehicleId: string;
  movementType: VehicleMovementType;
  gate?: string;
  recordedByPersonId: string;
  occurredAt: string;
  remarks?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  normalizedRegistrationNumber: string;
  vehicleType: VehicleType;
  ownerPersonId: string;
  propertyId: string;
  spaceId?: string;
  parkingSlot?: string;
  make?: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  rfidTag?: string;
  status: VehicleStatus;
  verifiedByPersonId?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  movements?: VehicleMovement[];
}

export interface VehicleMetrics {
  total: number;
  pending: number;
  verified: number;
  suspended: number;
  twoWheelers: number;
  cars: number;
  commercial: number;
  currentlyInside: number;
}

export interface VehicleFilters {
  propertyId?: string;
  spaceId?: string;
  ownerPersonId?: string;
  vehicleType?: VehicleType | "";
  status?: VehicleStatus | "";
  registrationNumber?: string;
  search?: string;
}

export interface CreateVehicleInput {
  registrationNumber: string;
  vehicleType: VehicleType;
  ownerPersonId: string;
  propertyId: string;
  spaceId?: string;
  parkingSlot?: string;
  make?: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  rfidTag?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
