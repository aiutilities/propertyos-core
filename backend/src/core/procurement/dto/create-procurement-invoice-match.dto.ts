export class CreateProcurementInvoiceMatchItemDto {
  purchaseOrderItemId!: string;

  goodsReceiptItemId?: string;

  invoicedQuantity!: number;

  unitPrice!: number;

  remarks?: string;
}

export class CreateProcurementInvoiceMatchDto {
  purchaseOrderId!: string;

  goodsReceiptId?: string;

  invoiceId?: string;

  externalInvoiceNumber?: string;

  invoiceDate?: string;

  invoiceAmount!: number;

  matchedByPersonId!: string;

  remarks?: string;

  items!: CreateProcurementInvoiceMatchItemDto[];
}
