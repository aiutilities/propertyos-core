export class CompleteVendorWorkOrderDto {
  completedByPersonId!: string;
  completionNotes!: string;
  actualCost?: number;
  remarks?: string;
}
