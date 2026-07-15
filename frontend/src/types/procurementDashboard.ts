export interface ProcurementDashboardPurchaseRequest {
  id: string;
  requestNumber?: string;
  purchaseRequestNumber?: string;
  title?: string;
  status: string;
  estimatedAmount?: number;
  totalEstimatedAmount?: number;
  propertyId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardRfq {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  quotationDeadline?: string;
  propertyId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardQuotation {
  id: string;
  quotationNumber: string;
  vendorId: string;
  status: string;
  totalAmount: number;
  currency: string;
  deliveryDays?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  title: string;
  vendorId: string;
  status: string;
  totalAmount: number;
  currency: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardGoodsReceipt {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  status: string;
  receiptDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardInvoiceMatch {
  id: string;
  invoiceMatchNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  status: string;
  invoiceAmount: number;
  amountVariance: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardPaymentRequest {
  id: string;
  paymentRequestNumber: string;
  vendorId: string;
  status: string;
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  currency: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementDashboardData {
  purchaseRequests: ProcurementDashboardPurchaseRequest[];
  rfqs: ProcurementDashboardRfq[];
  quotations: ProcurementDashboardQuotation[];
  purchaseOrders: ProcurementDashboardPurchaseOrder[];
  goodsReceipts: ProcurementDashboardGoodsReceipt[];
  invoiceMatches: ProcurementDashboardInvoiceMatch[];
  paymentRequests: ProcurementDashboardPaymentRequest[];
}

export interface ProcurementActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  href: string;
}

export interface VendorSpendSummary {
  vendorId: string;
  totalSpend: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface MonthlySpendSummary {
  month: string;
  amount: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
