export enum ProcurementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CONVERTED_TO_RFQ = 'CONVERTED_TO_RFQ',
  CONVERTED_TO_PO = 'CONVERTED_TO_PO',
  CLOSED = 'CLOSED',
}

export enum ProcurementApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ProcurementApprovalEntityType {
  PURCHASE_REQUEST = 'PURCHASE_REQUEST',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
}

export enum RfqStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum RfqVendorStatus {
  INVITED = 'INVITED',
  VIEWED = 'VIEWED',
  RESPONDED = 'RESPONDED',
  DECLINED = 'DECLINED',
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_EVALUATION = 'UNDER_EVALUATION',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

export enum ProcurementComparisonStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum GoodsReceiptStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum GoodsReceiptItemStatus {
  ACCEPTED = 'ACCEPTED',
  PARTIALLY_ACCEPTED = 'PARTIALLY_ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum InvoiceMatchStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  PARTIAL_MATCH = 'PARTIAL_MATCH',
  MISMATCH = 'MISMATCH',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ProcurementItemType {
  GOODS = 'GOODS',
  SERVICE = 'SERVICE',
  ASSET = 'ASSET',
  CONSUMABLE = 'CONSUMABLE',
  OTHER = 'OTHER',
}

export interface ProcurementCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  requiredByDate?: Date;
  estimatedAmount?: number;
  currency: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  closedAt?: Date;
  approvedByPersonId?: string;
  rejectedByPersonId?: string;
  cancelledByPersonId?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementApproval {
  id: string;
  entityType: ProcurementApprovalEntityType;
  entityId: string;
  sequenceNumber: number;
  approverPersonId: string;
  status: ProcurementApprovalStatus;
  remarks?: string;
  actedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementRfq {
  id: string;
  rfqNumber: string;
  purchaseRequestId: string;
  propertyId: string;
  title: string;
  description?: string;
  status: RfqStatus;
  issueDate?: Date;
  quotationDeadline: Date;
  deliveryRequiredBy?: Date;
  currency: string;
  termsAndConditions?: string;
  createdByPersonId: string;
  issuedByPersonId?: string;
  awardedQuotationId?: string;
  issuedAt?: Date;
  closedAt?: Date;
  awardedAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementRfqVendor {
  id: string;
  rfqId: string;
  vendorId: string;
  status: RfqVendorStatus;
  invitedAt: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
}

export interface ProcurementRfqItem {
  id: string;
  rfqId: string;
  purchaseRequestItemId?: string;
  lineNumber: number;
  itemType: ProcurementItemType;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
  createdAt: Date;
}

export interface ProcurementQuotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: QuotationStatus;
  vendorReference?: string;
  quotationDate: Date;
  validUntil: Date;
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
  submittedAt?: Date;
  selectedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  expiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementComparison {
  id: string;
  comparisonNumber: string;
  rfqId: string;
  status: ProcurementComparisonStatus;
  recommendedQuotationId?: string;
  recommendationReason?: string;
  createdByPersonId: string;
  completedByPersonId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementComparisonEntry {
  id: string;
  comparisonId: string;
  quotationId: string;
  vendorId: string;
  totalAmount: number;
  deliveryDays?: number;
  commercialScore?: number;
  technicalScore?: number;
  overallScore?: number;
  rank?: number;
  remarks?: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  propertyId: string;
  vendorId: string;
  purchaseRequestId?: string;
  rfqId?: string;
  quotationId?: string;
  vendorContractId?: string;
  title: string;
  description?: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  shippingAddress?: string;
  billingAddress?: string;
  createdByPersonId: string;
  approvedByPersonId?: string;
  issuedByPersonId?: string;
  acknowledgedByPersonId?: string;
  cancelledByPersonId?: string;
  approvedAt?: Date;
  issuedAt?: Date;
  acknowledgedAt?: Date;
  closedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  quotationItemId?: string;
  purchaseRequestItemId?: string;
  inventoryItemId?: string;
  lineNumber: number;
  itemType: ProcurementItemType;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface GoodsReceipt {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  propertyId: string;
  vendorId: string;
  destinationStoreId?: string;
  destinationBinLocationId?: string;
  status: GoodsReceiptStatus;
  receiptDate: Date;
  deliveryReference?: string;
  invoiceReference?: string;
  receivedByPersonId: string;
  postedByPersonId?: string;
  reversedByPersonId?: string;
  remarks?: string;
  postedAt?: Date;
  reversedAt?: Date;
  reversalReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  status: GoodsReceiptItemStatus;
  rejectionReason?: string;
  remarks?: string;

  batchId?: string;
  batchNumber?: string;
  manufacturerBatchNumber?: string;

  manufactureDate?: Date;
  expiryDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementInvoiceMatch {
  id: string;
  invoiceMatchNumber: string;
  purchaseOrderId: string;
  goodsReceiptId?: string;
  invoiceId?: string;
  vendorId: string;
  propertyId: string;
  externalInvoiceNumber?: string;
  invoiceDate?: Date;
  invoiceAmount: number;
  purchaseOrderAmount: number;
  goodsReceiptAmount?: number;
  amountVariance: number;
  quantityVariance: number;
  status: InvoiceMatchStatus;
  matchedByPersonId: string;
  approvedByPersonId?: string;
  rejectedByPersonId?: string;
  matchedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementInvoiceMatchItem {
  id: string;
  invoiceMatchId: string;
  purchaseOrderItemId: string;
  goodsReceiptItemId?: string;
  invoicedQuantity: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  invoiceLineAmount: number;
  purchaseOrderLineAmount: number;
  amountVariance: number;
  quantityVariance: number;
  isMatched: boolean;
  remarks?: string;
  createdAt: Date;
}

export interface ProcurementPaymentRequest {
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
  dueDate?: Date;
  status: PaymentRequestStatus;
  requestedByPersonId: string;
  approvedByPersonId?: string;
  rejectedByPersonId?: string;
  paidByPersonId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  paidAt?: Date;
  rejectionReason?: string;
  paymentReference?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementStatusHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
}

export interface ProcurementMetrics {
  purchaseRequests: {
    total: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
  };
  rfqs: {
    open: number;
    expiring: number;
    awarded: number;
  };
  purchaseOrders: {
    total: number;
    pendingApproval: number;
    open: number;
    partiallyReceived: number;
  };
  goodsReceipts: {
    draft: number;
    posted: number;
  };
  invoiceMatches: {
    pending: number;
    matched: number;
    mismatched: number;
  };
  paymentRequests: {
    pending: number;
    approved: number;
    overdue: number;
  };
}
