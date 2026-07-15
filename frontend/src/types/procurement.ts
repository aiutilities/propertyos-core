export type ProcurementPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProcurementItemType = "GOODS" | "SERVICE" | "ASSET" | "CONSUMABLE" | "OTHER";
export type PurchaseRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CONVERTED_TO_RFQ"
  | "CONVERTED_TO_PO"
  | "CLOSED";

export interface ProcurementCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestItem {
  id: string;
  purchaseRequestId: string;
  lineNumber: number;
  itemType: ProcurementItemType;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  estimatedAmount?: number;
  specifications?: string;
  preferredVendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementStatusHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  categoryId: string;
  requestedByPersonId: string;
  title: string;
  description?: string;
  businessJustification?: string;
  priority: ProcurementPriority;
  status: PurchaseRequestStatus;
  requiredByDate?: string;
  estimatedAmount?: number;
  currency: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  closedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestDetails extends PurchaseRequest {
  items: PurchaseRequestItem[];
  category?: ProcurementCategory;
  history: ProcurementStatusHistory[];
}

export interface ProcurementMetrics {
  purchaseRequests: { total: number; pendingApproval: number; approved: number; rejected: number };
  rfqs: { open: number; expiring: number; awarded: number };
  purchaseOrders: { total: number; pendingApproval: number; open: number; partiallyReceived: number };
  goodsReceipts: { draft: number; posted: number };
  invoiceMatches: { pending: number; matched: number; mismatched: number };
  paymentRequests: { pending: number; approved: number; overdue: number };
}

export interface PurchaseRequestFilters {
  propertyId?: string;
  categoryId?: string;
  requestedByPersonId?: string;
  status?: PurchaseRequestStatus | "";
  search?: string;
}

export interface CreatePurchaseRequestItemInput {
  itemType: ProcurementItemType;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  specifications?: string;
  preferredVendorId?: string;
}

export interface CreatePurchaseRequestInput {
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  categoryId: string;
  requestedByPersonId: string;
  title: string;
  description?: string;
  businessJustification?: string;
  priority: ProcurementPriority;
  requiredByDate?: string;
  currency: string;
  items: CreatePurchaseRequestItemInput[];
}

export interface ApiSuccessResponse<T> { success: true; data: T }
