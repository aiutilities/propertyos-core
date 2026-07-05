export type AgreementStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'RENEWED';

export interface Agreement {
  id: string;
  tenantId: string;
  agreementNumber: string;
  currentVersionId?: string;
  status: AgreementStatus;
  createdAt: string;
  updatedAt: string;
}

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
