export class CreateProcurementPurchaseOrderDto {
  quotationId!: string;

  title!: string;
  description?: string;

  orderDate?: string;
  expectedDeliveryDate?: string;

  shippingAddress?: string;
  billingAddress?: string;

  paymentTerms?: string;
  deliveryTerms?: string;

  vendorContractId?: string;

  createdByPersonId!: string;
}
