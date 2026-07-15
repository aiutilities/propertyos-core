export type PaymentRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";

export interface PaymentRequestHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  paymentRequestNumber: string;
  vendorId: string;
  propertyId: string;
  purchaseOrderId?: string;
  invoiceMatchId?: string;
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  currency: string;
  dueDate?: string;
  status: PaymentRequestStatus;
  requestedByPersonId: string;
  approvedByPersonId?: string;
  rejectedByPersonId?: string;
  paidByPersonId?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  paymentReference?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestDetails
  extends PaymentRequest {
  history: PaymentRequestHistory[];
}

export interface PaymentRequestFilters {
  invoiceMatchId?: string;
  purchaseOrderId?: string;
  vendorId?: string;
  propertyId?: string;
  status?: PaymentRequestStatus | "";
  overdue?: string;
  search?: string;
}

export interface ApprovedInvoiceMatch {
  id: string;
  invoiceMatchNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  propertyId: string;
  externalInvoiceNumber?: string;
  invoiceAmount: number;
  currency?: string;
  status: string;
  approvedAt?: string;
}

export interface CreatePaymentRequestInput {
  invoiceMatchId: string;
  requestedAmount?: number;
  currency?: string;
  dueDate?: string;
  requestedByPersonId: string;
  remarks?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
