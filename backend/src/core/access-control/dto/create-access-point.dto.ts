import {
  AccessDirection,
  AccessPointType,
} from "../types/access-control.types";

export class CreateAccessPointDto {
  propertyId!: string;
  zoneId?: string;
  spaceId?: string;
  code!: string;
  name!: string;
  description?: string;
  accessPointType!: AccessPointType;
  direction!: AccessDirection;
  controllerProvider?: string;
  controllerReference?: string;
  requiresAntiPassback?: boolean;
  metadata?: Record<string, unknown>;
}
