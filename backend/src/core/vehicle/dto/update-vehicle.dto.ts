import {
  VehicleType,
} from '../types/vehicle.types';

export class UpdateVehicleDto {
  vehicleType?: VehicleType;
  ownerPersonId?: string;
  spaceId?: string;
  parkingSlot?: string;
  make?: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  rfidTag?: string;
  notes?: string;
  changedByPersonId!: string;
  remarks?: string;
}
