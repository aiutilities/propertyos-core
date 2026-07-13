import {
  Vehicle,
  VehicleDetails,
  VehicleFilters,
  VehicleMetrics,
  VehicleMovement,
  VehicleStatus,
} from '../types/vehicle.types';

export const VEHICLE_REPOSITORY =
  Symbol('VEHICLE_REPOSITORY');

export interface VehicleRepository {
  create(vehicle: Vehicle): Promise<Vehicle>;

  findById(id: string): Promise<Vehicle | null>;

  findDetailsById(
    id: string,
  ): Promise<VehicleDetails | null>;

  findByNormalizedRegistration(
    normalizedRegistrationNumber: string,
  ): Promise<Vehicle | null>;

  list(
    filters?: VehicleFilters,
  ): Promise<Vehicle[]>;

  update(
    id: string,
    input: Partial<Vehicle>,
  ): Promise<Vehicle | null>;

  updateStatus(
    id: string,
    status: VehicleStatus,
    input?: {
      verifiedByPersonId?: string;
      verifiedAt?: Date;
      rejectionReason?: string;
    },
  ): Promise<Vehicle | null>;

  recordMovement(
    movement: VehicleMovement,
  ): Promise<VehicleMovement>;

  listMovements(
    vehicleId: string,
  ): Promise<VehicleMovement[]>;

  getMetrics(
    propertyId?: string,
  ): Promise<VehicleMetrics>;
}
