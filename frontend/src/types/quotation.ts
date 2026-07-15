export type QuotationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_EVALUATION"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export type RfqStatus =
  | "DRAFT"
  | "ISSUED"
  | "OPEN"
  | "CLOSED"
  | "AWARDED"
  | "CANCELLED"
  | "EXPIRED";

export interface QuotationStatusHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface QuotationRfqItem {
  id: string;
  rfqId: string;
  lineNumber: number;
  itemType: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
  createdAt: string;
}

export interface QuotationRfqVendor {
  id: string;
  rfqId: string;
  vendorId: string;
  status: string;
  invitedAt: string;
  viewedAt?: string;
  respondedAt?: string;
}

export interface QuotationRfq {
  id: string;
  rfqNumber: string;
  purchaseRequestId: string;
  propertyId: string;
  title: string;
  description?: string;
  status: RfqStatus;
  quotationDeadline: string;
  deliveryRequiredBy?: string;
  currency: string;
  termsAndConditions?: string;
  createdByPersonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationRfqDetails extends QuotationRfq {
  items: QuotationRfqItem[];
  vendors: QuotationRfqVendor[];
  history?: QuotationStatusHistory[];
}

export interface ProcurementQuotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: QuotationStatus;
  vendorReference?: string;
  quotationDate: string;
  validUntil: string;
  deliveryDays?: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  submittedAt?: string;
  selectedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementQuotationItem {
  id: string;
  quotationId: string;
  rfqItemId: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  deliveryDays?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementQuotationDetails
  extends ProcurementQuotation {
  items: ProcurementQuotationItem[];
  history: QuotationStatusHistory[];
}

export interface QuotationFilters {
  rfqId?: string;
  vendorId?: string;
  propertyId?: string;
  status?: QuotationStatus | "";
  search?: string;
}

export interface CreateQuotationItemInput {
  rfqItemId: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  deliveryDays?: number;
  remarks?: string;
}

export interface CreateQuotationInput {
  rfqId: string;
  vendorId: string;
  vendorReference?: string;
  quotationDate?: string;
  validUntil: string;
  deliveryDays?: number;
  discountAmount: number;
  freightAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  submittedByPersonId: string;
  items: CreateQuotationItemInput[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
