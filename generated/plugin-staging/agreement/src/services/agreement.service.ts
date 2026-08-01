import { Inject, Injectable } from '@nestjs/common';

import { EventBusService } from '@propertyos/core-contracts';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@propertyos/core-contracts';
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
    private readonly eventBusService: EventBusService,
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

    const agreementWithVersion: Agreement = {
      ...agreement,
      currentVersionId: version.id,
    };

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'agreement.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Agreement created',
        message: `Agreement created successfully: ${agreement.agreementNumber}`,
        metadata: {
          domainEventType: 'AGREEMENT_CREATED',
          agreementId: agreement.id,
          agreementVersionId: version.id,
          tenantId: agreement.tenantId,
          agreementNumber: agreement.agreementNumber,
        },
      },
    );

    return agreementWithVersion;
  }

  listAgreements(): Promise<Agreement[]> {
    return this.agreementRepository.listAgreements();
  }

  listAgreementsPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Agreement>> {
    return this.agreementRepository.listAgreementsPaginated(query);
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
