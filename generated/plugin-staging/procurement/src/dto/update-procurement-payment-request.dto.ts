export class UpdateProcurementPaymentRequestDto {
  requestedAmount?: number;

  currency?: string;

  dueDate?: string;

  remarks?: string;

  updatedByPersonId!: string;
}
