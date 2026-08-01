import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '@propertyos/core-contracts';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '@propertyos/core-contracts';
import { AgreementService } from './services/agreement.service';

@Injectable()
export class AgreementSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly agreementService: AgreementService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'core-agreement-search',
      entityType: 'AGREEMENT',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const result = await this.agreementService.listAgreementsPaginated({
      search: query.query,
      limit: query.limit ?? 25,
    });

    return result.items.map((agreement) => ({
      id: `AGREEMENT:${agreement.id}`,
      entityType: 'AGREEMENT',
      entityId: agreement.id,
      title: agreement.agreementNumber,
      description: [
        agreement.status,
        agreement.tenantId,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.scoreAgreement(query.query, agreement),
      metadata: {
        tenantId: agreement.tenantId,
        status: agreement.status,
        currentVersionId: agreement.currentVersionId,
      },
    }));
  }

  private scoreAgreement(query: string, agreement: any): number {
    const normalizedQuery = query.toLowerCase();
    const agreementNumber = String(
      agreement.agreementNumber ?? '',
    ).toLowerCase();

    if (agreementNumber === normalizedQuery) {
      return 100;
    }

    if (agreementNumber.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
