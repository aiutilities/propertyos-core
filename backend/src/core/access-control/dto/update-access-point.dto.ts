import {
  AccessDirection,
  AccessPointStatus,
  AccessPointType,
} from "../types/access-control.types";

export class UpdateAccessPointDto {
  zoneId?: string;
  spaceId?: string;
  name?: string;
  description?: string;
  accessPointType?: AccessPointType;
  direction?: AccessDirection;
  status?: AccessPointStatus;
  controllerProvider?: string;
  controllerReference?: string;
  requiresAntiPassback?: boolean;
  metadata?: Record<string, unknown>;
  changedByPersonId!: string;
  remarks?: string;
}
