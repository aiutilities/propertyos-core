import {
  Agreement,
  AgreementVersion,
} from '../types/agreement.types';

export const AGREEMENT_REPOSITORY = 'AGREEMENT_REPOSITORY';

export interface AgreementRepositoryPort {
  createAgreement(
    input: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Agreement>;

  getAgreement(id: string): Promise<Agreement | undefined>;

  listAgreements(): Promise<Agreement[]>;

  createAgreementVersion(
    input: Omit<AgreementVersion, 'id' | 'createdAt'>,
  ): Promise<AgreementVersion>;

  listAgreementVersions(
    agreementId: string,
  ): Promise<AgreementVersion[]>;
}
