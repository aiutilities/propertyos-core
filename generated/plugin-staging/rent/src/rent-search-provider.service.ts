import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '@propertyos/core-contracts';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '@propertyos/core-contracts';
import { RentService } from './services/rent.service';

@Injectable()
export class RentSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly rentService: RentService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'core-rent-search',
      entityType: 'RENT_LEDGER',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const result = await this.rentService.listRentLedgersPaginated({
      search: query.query,
      limit: query.limit ?? 25,
    });

    return result.items.map((ledger) => ({
      id: `RENT_LEDGER:${ledger.id}`,
      entityType: 'RENT_LEDGER',
      entityId: ledger.id,
      title: `Rent ${ledger.periodMonth}/${ledger.periodYear}`,
      description: [
        ledger.status,
        `Rent: ${ledger.rentAmount}`,
        `Paid: ${ledger.amountPaid}`,
        `Balance: ${ledger.balanceAmount}`,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.scoreRentLedger(query.query, ledger),
      metadata: {
        tenantId: ledger.tenantId,
        agreementId: ledger.agreementId,
        periodYear: ledger.periodYear,
        periodMonth: ledger.periodMonth,
        dueDate: ledger.dueDate,
        rentAmount: ledger.rentAmount,
        amountPaid: ledger.amountPaid,
        balanceAmount: ledger.balanceAmount,
        status: ledger.status,
      },
    }));
  }

  private scoreRentLedger(query: string, ledger: any): number {
    const normalizedQuery = query.toLowerCase();
    const status = String(ledger.status ?? '').toLowerCase();

    if (status === normalizedQuery) {
      return 100;
    }

    if (status.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
