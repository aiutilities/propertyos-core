import {
  VehicleStatus,
} from '../types/vehicle.types';

export class UpdateVehicleStatusDto {
  status!: VehicleStatus;
  changedByPersonId!: string;
  reason?: string;
}
