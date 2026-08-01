export class CreateReceiptDto {
  receiptNumber!: string;

  rentPaymentId!: string;
  rentLedgerId!: string;
  tenantId!: string;

  amount!: number;

  receiptDate!: string;

  paymentMode!: string;
  referenceNumber?: string;
}
