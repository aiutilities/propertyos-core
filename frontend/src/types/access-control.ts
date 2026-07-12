export type AccessPointType =
  "GATE" | "DOOR" | "TURNSTILE" | "VEHICLE_BARRIER" | "ELEVATOR" | "OTHER";

export type AccessDirection = "ENTRY" | "EXIT" | "BIDIRECTIONAL";

export type AccessPointStatus =
  "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "EMERGENCY_OPEN" | "ARCHIVED";

export type AccessSubjectType = "PERSON" | "STAFF" | "VISITOR" | "VEHICLE";

export type AccessGrantStatus = "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED";

export type AccessDecision = "GRANTED" | "DENIED";

export type AccessEventType = "ENTRY" | "EXIT";

export type AccessDenialReason =
  | "ACCESS_POINT_INACTIVE"
  | "GRANT_NOT_FOUND"
  | "GRANT_INACTIVE"
  | "GRANT_NOT_STARTED"
  | "GRANT_EXPIRED"
  | "DIRECTION_NOT_ALLOWED"
  | "SCHEDULE_NOT_ALLOWED"
  | "CREDENTIAL_INVALID"
  | "ANTI_PASSBACK"
  | "SUBJECT_INACTIVE"
  | "OTHER";

export interface AccessPoint {
  id: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  code: string;
  normalizedCode: string;
  name: string;
  description?: string;
  accessPointType: AccessPointType;
  direction: AccessDirection;
  status: AccessPointStatus;
  controllerProvider?: string;
  controllerReference?: string;
  requiresAntiPassback: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccessSchedule {
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
}

export interface AccessGrant {
  id: string;
  accessPointId: string;
  subjectType: AccessSubjectType;
  subjectId: string;
  direction: AccessDirection;
  status: AccessGrantStatus;
  validFrom?: string;
  validUntil?: string;
  schedule?: AccessSchedule;
  issuedByPersonId: string;
  revokedByPersonId?: string;
  revokedAt?: string;
  revocationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessEvent {
  id: string;
  accessPointId: string;
  subjectType?: AccessSubjectType;
  subjectId?: string;
  credentialId?: string;
  eventType: AccessEventType;
  decision: AccessDecision;
  denialReason?: AccessDenialReason;
  grantId?: string;
  recordedByPersonId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AccessMetrics {
  totalAccessPoints: number;
  activeAccessPoints: number;
  maintenanceAccessPoints: number;
  activeGrants: number;
  grantedToday: number;
  deniedToday: number;
  currentlyInside: number;
}

export interface AccessEvaluation {
  accessPoint: AccessPoint;
  eventType: AccessEventType;
  decision: AccessDecision;
  denialReason?: AccessDenialReason;
  subjectType?: AccessSubjectType;
  subjectId?: string;
  credentialId?: string;
  grant?: AccessGrant;
}

export interface CreateAccessPointInput {
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  code: string;
  name: string;
  description?: string;
  accessPointType: AccessPointType;
  direction: AccessDirection;
  controllerProvider?: string;
  controllerReference?: string;
  requiresAntiPassback?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateAccessGrantInput {
  accessPointId: string;
  subjectType: AccessSubjectType;
  subjectId: string;
  direction: AccessDirection;
  validFrom?: string;
  validUntil?: string;
  schedule?: AccessSchedule;
  issuedByPersonId: string;
  notes?: string;
}

export interface EvaluateAccessInput {
  accessPointCode: string;
  propertyId: string;
  credentialType: string;
  credentialValue: string;
  eventType: AccessEventType;
  recordedByPersonId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
