import { AccessEventType } from "../types/access-control.types";

export class EvaluateAccessDto {
  accessPointCode!: string;
  propertyId!: string;
  credentialType!: string;
  credentialValue!: string;
  eventType!: AccessEventType;
  recordedByPersonId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}
