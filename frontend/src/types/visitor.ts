export type VisitorStatus =
  | "invited"
  | "approved"
  | "rejected"
  | "arrived"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "expired"
  | "completed";

export interface VisitorIdentity {
  fullName: string;
  mobile: string;
  email?: string;
}

export interface Visit {
  id: string;
  visitorId: string;
  propertyId: string;
  hostPersonId: string;
  visitDate: string;
  visitPurpose?: string;
  status: VisitorStatus;
  approvedAt?: string;
  rejectedAt?: string;
  arrivedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  notes?: string;
  visitor?: VisitorIdentity;
  createdAt: string;
  updatedAt: string;
}

export interface VisitListData {
  items: Visit[];
  total: number;
  filters: Record<string, unknown>;
}

export interface VisitListResponse {
  success: boolean;
  data: VisitListData;
}

export interface VisitResponse {
  success: boolean;
  data: Visit;
}

export interface VisitorHistoryEntry {
  id: string;
  visitId: string;
  previousStatus?: string;
  newStatus: string;
  changedByPersonId?: string;
  changeReason?: string;
  createdAt: string;
}

export interface VisitorHistoryResponse {
  success: boolean;
  data: {
    visitId: string;
    items: VisitorHistoryEntry[];
  };
}

export interface VisitorInviteInput {
  visitorName: string;
  mobile: string;
  email?: string;
  visitDate: string;
  visitPurpose?: string;
  hostPersonId: string;
  propertyId: string;
}

export interface QrPass {
  id: string;
  visitId: string;
  qrToken: string;
  expiresAt: string;
  generatedAt: string;
  status: string;
}

export interface QrPassResponse {
  success: boolean;
  data: QrPass;
}
