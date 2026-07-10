export interface AgreementVersion {
  id: string;
  agreementId: string;
  versionNumber: number;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  depositAmount: number;
  noticePeriodDays: number;
  agreementDocumentUrl?: string;
  createdAt: string;
}

export interface AgreementVersionResponse {
  success: boolean;
  data: AgreementVersion[];
}
