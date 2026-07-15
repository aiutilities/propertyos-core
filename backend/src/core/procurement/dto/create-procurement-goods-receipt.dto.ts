export class CreateProcurementGoodsReceiptItemDto {
  purchaseOrderItemId!: string;

  receivedQuantity!: number;
  acceptedQuantity!: number;
  rejectedQuantity = 0;

  rejectionReason?: string;
  remarks?: string;
}

export class CreateProcurementGoodsReceiptDto {
  purchaseOrderId!: string;

  destinationStoreId?: string;
  destinationBinLocationId?: string;

  receiptDate?: string;

  deliveryReference?: string;
  invoiceReference?: string;

  receivedByPersonId!: string;

  remarks?: string;

  items!: CreateProcurementGoodsReceiptItemDto[];
}
