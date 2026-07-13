export class CancelVendorWorkOrderDto {
  cancelledByPersonId!: string;
  cancellationReason!: string;
  remarks?: string;
}
