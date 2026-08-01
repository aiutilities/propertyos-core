import {
  VehicleMovementType,
} from '../types/vehicle.types';

export class RecordVehicleMovementDto {
  movementType!: VehicleMovementType;
  gate?: string;
  recordedByPersonId!: string;
  occurredAt?: string;
  remarks?: string;
}
