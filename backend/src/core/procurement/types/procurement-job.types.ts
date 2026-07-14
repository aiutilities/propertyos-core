export interface ProcurementRfqExpiryJobPayload {
  rfqId: string;
}

export interface ProcurementQuotationExpiryJobPayload {
  quotationId: string;
}

export interface ProcurementPurchaseOrderReminderJobPayload {
  purchaseOrderId: string;
}

export interface ProcurementPaymentReminderJobPayload {
  paymentRequestId: string;
}
