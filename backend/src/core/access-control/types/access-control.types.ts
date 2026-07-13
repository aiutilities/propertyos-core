export enum AccessPointType {
  GATE = "GATE",
  DOOR = "DOOR",
  TURNSTILE = "TURNSTILE",
  VEHICLE_BARRIER = "VEHICLE_BARRIER",
  ELEVATOR = "ELEVATOR",
  OTHER = "OTHER",
}

export enum AccessDirection {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
  BIDIRECTIONAL = "BIDIRECTIONAL",
}

export enum AccessPointStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
  EMERGENCY_OPEN = "EMERGENCY_OPEN",
  ARCHIVED = "ARCHIVED",
}

export enum AccessSubjectType {
  PERSON = "PERSON",
  STAFF = "STAFF",
  VISITOR = "VISITOR",
  VEHICLE = "VEHICLE",
}

export enum AccessGrantStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export enum AccessDecision {
  GRANTED = "GRANTED",
  DENIED = "DENIED",
}

export enum AccessDenialReason {
  ACCESS_POINT_INACTIVE = "ACCESS_POINT_INACTIVE",
  GRANT_NOT_FOUND = "GRANT_NOT_FOUND",
  GRANT_INACTIVE = "GRANT_INACTIVE",
  GRANT_NOT_STARTED = "GRANT_NOT_STARTED",
  GRANT_EXPIRED = "GRANT_EXPIRED",
  DIRECTION_NOT_ALLOWED = "DIRECTION_NOT_ALLOWED",
  SCHEDULE_NOT_ALLOWED = "SCHEDULE_NOT_ALLOWED",
  CREDENTIAL_INVALID = "CREDENTIAL_INVALID",
  ANTI_PASSBACK = "ANTI_PASSBACK",
  SUBJECT_INACTIVE = "SUBJECT_INACTIVE",
  OTHER = "OTHER",
}

export enum AccessEventType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
}

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
  createdAt: Date;
  updatedAt: Date;
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
  validFrom?: Date;
  validUntil?: Date;
  schedule?: AccessSchedule;
  issuedByPersonId: string;
  revokedByPersonId?: string;
  revokedAt?: Date;
  revocationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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
  occurredAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AccessPointFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  accessPointType?: AccessPointType;
  status?: AccessPointStatus;
  search?: string;
}

export interface AccessGrantFilters {
  accessPointId?: string;
  subjectType?: AccessSubjectType;
  subjectId?: string;
  status?: AccessGrantStatus;
  activeAt?: Date;
}

export interface AccessEventFilters {
  accessPointId?: string;
  propertyId?: string;
  subjectType?: AccessSubjectType;
  subjectId?: string;
  eventType?: AccessEventType;
  decision?: AccessDecision;
  occurredFrom?: Date;
  occurredUntil?: Date;
  limit?: number;
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

export interface AccessMetrics {
  totalAccessPoints: number;
  activeAccessPoints: number;
  maintenanceAccessPoints: number;
  activeGrants: number;
  grantedToday: number;
  deniedToday: number;
  currentlyInside: number;
}
