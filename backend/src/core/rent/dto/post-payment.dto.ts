export class PostPaymentDto {
  paymentDate!: string;

  amount!: number;

  paymentMode!: string;

  referenceNumber?: string;

  notes?: string;
}
