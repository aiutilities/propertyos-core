export type InvoiceMatchStatus =
  | "PENDING"
  | "MATCHED"
  | "APPROVED"
  | "REJECTED";

export interface InvoiceMatchHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface InvoiceMatchItem {
  id: string;
  invoiceMatchId: string;
  purchaseOrderItemId: string;
  goodsReceiptItemId?: string;
  lineNumber: number;
  description?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  invoicedQuantity: number;
  unit: string;
  purchaseOrderUnitPrice: number;
  invoiceUnitPrice: number;
  quantityVariance: number;
  unitPriceVariance: number;
  amountVariance: number;
  invoiceLineAmount: number;
  isMatched: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceMatch {
  id: string;
  invoiceMatchNumber: string;
  purchaseOrderId: string;
  goodsReceiptId?: string;
  propertyId: string;
  vendorId: string;
  status: InvoiceMatchStatus;
  externalInvoiceNumber: string;
  invoiceDate?: string;
  purchaseOrderAmount: number;
  invoiceAmount: number;
  amountVariance: number;
  quantityVariance: number;
  currency: string;
  matchedByPersonId: string;
  approvedByPersonId?: string;
  rejectedByPersonId?: string;
  matchedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceMatchDetails
  extends InvoiceMatch {
  items: InvoiceMatchItem[];
  history: InvoiceMatchHistory[];
}

export interface InvoiceMatchFilters {
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  vendorId?: string;
  propertyId?: string;
  status?: InvoiceMatchStatus | "";
  search?: string;
}

export interface InvoiceMatchPurchaseOrderItem {
  id: string;
  lineNumber: number;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceMatchPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  propertyId: string;
  vendorId: string;
  status: string;
  title: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  items?: InvoiceMatchPurchaseOrderItem[];
}

export interface InvoiceMatchGoodsReceiptItem {
  id: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
}

export interface InvoiceMatchGoodsReceipt {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  status: string;
  receiptDate: string;
  invoiceNumber?: string;
  items?: InvoiceMatchGoodsReceiptItem[];
}

export interface CreateInvoiceMatchItemInput {
  purchaseOrderItemId: string;
  goodsReceiptItemId?: string;
  invoicedQuantity: number;
  unitPrice: number;
  remarks?: string;
}

export interface CreateInvoiceMatchInput {
  purchaseOrderId: string;
  goodsReceiptId?: string;
  externalInvoiceNumber: string;
  invoiceDate?: string;
  invoiceAmount: number;
  matchedByPersonId: string;
  remarks?: string;
  items: CreateInvoiceMatchItemInput[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
