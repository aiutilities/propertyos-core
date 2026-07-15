import type {
  QuotationStatus,
} from "@/types/quotation";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ISSUED"
  | "ACKNOWLEDGED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CLOSED"
  | "CANCELLED";

export interface PurchaseOrderHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  quotationItemId: string;
  purchaseRequestItemId?: string;
  lineNumber: number;
  itemType: string;
  itemCode?: string;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  quotationId: string;
  rfqId: string;
  purchaseRequestId: string;
  propertyId: string;
  vendorId: string;
  vendorContractId?: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  shippingAddress?: string;
  billingAddress?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  title: string;
  description?: string;
  createdByPersonId: string;
  approvedByPersonId?: string;
  issuedByPersonId?: string;
  acknowledgedByPersonId?: string;
  cancelledByPersonId?: string;
  approvedAt?: string;
  issuedAt?: string;
  acknowledgedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderDetails
  extends PurchaseOrder {
  items: PurchaseOrderItem[];
  history: PurchaseOrderHistory[];
}

export interface PurchaseOrderFilters {
  quotationId?: string;
  rfqId?: string;
  purchaseRequestId?: string;
  propertyId?: string;
  vendorId?: string;
  status?: PurchaseOrderStatus | "";
  search?: string;
}

export interface SelectedQuotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: QuotationStatus;
  totalAmount: number;
  currency: string;
  deliveryDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  quotationId: string;
  title: string;
  description?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  vendorContractId?: string;
  createdByPersonId: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
