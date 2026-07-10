export class CreateAgreementDto {
  tenantId!: string;
  agreementNumber!: string;

  startDate!: string;
  endDate?: string;

  rentAmount!: number;
  depositAmount!: number;

  noticePeriodDays!: number;
}
