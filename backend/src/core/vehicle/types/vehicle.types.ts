export enum VehicleType {
  TWO_WHEELER = 'TWO_WHEELER',
  CAR = 'CAR',
  COMMERCIAL = 'COMMERCIAL',
  BICYCLE = 'BICYCLE',
  OTHER = 'OTHER',
}

export enum VehicleStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum VehicleMovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
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
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleMovement {
  id: string;
  vehicleId: string;
  movementType: VehicleMovementType;
  gate?: string;
  recordedByPersonId: string;
  occurredAt: Date;
  remarks?: string;
  createdAt: Date;
}

export interface VehicleDetails extends Vehicle {
  movements: VehicleMovement[];
}

export interface VehicleFilters {
  propertyId?: string;
  spaceId?: string;
  ownerPersonId?: string;
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  registrationNumber?: string;
  search?: string;
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
