export type GoodsReceiptStatus =
  | "DRAFT"
  | "POSTED"
  | "CANCELLED";

export interface GoodsReceiptHistory {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  rejectionReason?: string;
  inspectionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  propertyId: string;
  vendorId: string;
  status: GoodsReceiptStatus;
  receiptDate: string;
  deliveryNoteNumber?: string;
  invoiceNumber?: string;
  receivedByPersonId: string;
  postedByPersonId?: string;
  postedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptDetails
  extends GoodsReceipt {
  items: GoodsReceiptItem[];
  history: GoodsReceiptHistory[];
}

export interface GoodsReceiptFilters {
  purchaseOrderId?: string;
  propertyId?: string;
  vendorId?: string;
  status?: GoodsReceiptStatus | "";
  search?: string;
}

export interface ReceivablePurchaseOrderItem {
  id: string;
  lineNumber: number;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
}

export interface ReceivablePurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  propertyId: string;
  vendorId: string;
  status: string;
  title: string;
  currency: string;
  totalAmount: number;
  items?: ReceivablePurchaseOrderItem[];
}

export interface CreateGoodsReceiptItemInput {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  inspectionNotes?: string;
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  receiptDate?: string;
  deliveryNoteNumber?: string;
  invoiceNumber?: string;
  receivedByPersonId: string;
  notes?: string;
  items: CreateGoodsReceiptItemInput[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
