export class UpdateProcurementPurchaseOrderDto {
  title?: string;
  description?: string;

  orderDate?: string;
  expectedDeliveryDate?: string;

  shippingAddress?: string;
  billingAddress?: string;

  paymentTerms?: string;
  deliveryTerms?: string;

  vendorContractId?: string;

  updatedByPersonId!: string;
}
