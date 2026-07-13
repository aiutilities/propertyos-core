export class RenewVendorContractDto {
  startDate!: string;
  endDate!: string;

  contractValue?: number;
  responseSlaMinutes?: number;
  resolutionSlaMinutes?: number;

  changedByPersonId!: string;
  remarks?: string;
}
