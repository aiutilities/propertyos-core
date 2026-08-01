export class CreateRentLedgerDto {
  tenantId!: string;
  agreementId!: string;

  periodYear!: number;
  periodMonth!: number;

  dueDate!: string;

  rentAmount!: number;
}
