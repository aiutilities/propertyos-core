export interface VisitorEvent {
  id: string;
  name: string;
  source: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface VisitorFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  propertyId?: string;
  hostPersonId?: string;
  visitDate?: string;
}

export interface VisitorSettings {
  allowQrInvite: boolean;
  hostApprovalRequired: boolean;
  defaultVisitDurationHours: number;
  notifyHostOnCheckIn: boolean;
  notifyHostOnCheckOut: boolean;
}

export interface QrValidationResult {
  valid: boolean;
  visitId?: string;
  visitorId?: string;
  reason?: string;
}

export interface StatusTransition {
  previousStatus?: string;
  newStatus: string;
  changedByPersonId?: string;
  reason?: string;
}

export interface VisitorInvitePayload {
  visitorId: string;
  visitId: string;
  propertyId: string;
  hostPersonId: string;
  visitDate: string;
  status: string;
}

export interface VisitorCheckInPayload {
  visitId: string;
  checkedInAt: Date;
  gate?: string;
  securityPersonId?: string;
}

export interface VisitorCheckOutPayload {
  visitId: string;
  checkedOutAt: Date;
  gate?: string;
  securityPersonId?: string;
}
