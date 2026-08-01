import {
  VehicleType,
} from '../types/vehicle.types';

export class CreateVehicleDto {
  registrationNumber!: string;
  vehicleType!: VehicleType;
  ownerPersonId!: string;
  propertyId!: string;
  spaceId?: string;
  parkingSlot?: string;
  make?: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  rfidTag?: string;
  notes?: string;
}
