export class CreateProcurementPaymentRequestDto {
  invoiceMatchId!: string;

  requestedAmount?: number;

  currency?: string;

  dueDate?: string;

  requestedByPersonId!: string;

  remarks?: string;
}
