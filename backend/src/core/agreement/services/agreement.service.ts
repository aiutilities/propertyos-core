import { Inject, Injectable } from '@nestjs/common';

import {
  Agreement,
  AgreementVersion,
} from '../types/agreement.types';
import {
  AGREEMENT_REPOSITORY,
  AgreementRepositoryPort,
} from '../repositories/agreement-repository.interface';

export { AGREEMENT_REPOSITORY };

@Injectable()
export class AgreementService {
  constructor(
    @Inject(AGREEMENT_REPOSITORY)
    private readonly agreementRepository: AgreementRepositoryPort,
  ) {}

  async createAgreement(input: {
    tenantId: string;
    agreementNumber: string;
    startDate: string;
    endDate?: string;
    rentAmount: number;
    depositAmount: number;
    noticePeriodDays: number;
  }): Promise<Agreement> {
    const agreement = await this.agreementRepository.createAgreement({
      tenantId: input.tenantId,
      agreementNumber: input.agreementNumber,
      status: 'ACTIVE',
    });

    const version = await this.agreementRepository.createAgreementVersion({
      agreementId: agreement.id,
      versionNumber: 1,
      startDate: input.startDate,
      endDate: input.endDate,
      rentAmount: input.rentAmount,
      depositAmount: input.depositAmount,
      noticePeriodDays: input.noticePeriodDays,
    });

    return {
      ...agreement,
      currentVersionId: version.id,
    };
  }

  listAgreements(): Promise<Agreement[]> {
    return this.agreementRepository.listAgreements();
  }

  getAgreement(id: string): Promise<Agreement | undefined> {
    return this.agreementRepository.getAgreement(id);
  }

  listAgreementVersions(
    agreementId: string,
  ): Promise<AgreementVersion[]> {
    return this.agreementRepository.listAgreementVersions(agreementId);
  }
}
