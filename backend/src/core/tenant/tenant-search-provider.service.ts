import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { TenantService } from './services/tenant.service';

@Injectable()
export class TenantSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly tenantService: TenantService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'core-tenant-search',
      entityType: 'TENANT',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const result = await this.tenantService.listTenantsPaginated({
      search: query.query,
      limit: query.limit ?? 25,
    });

    return result.items.map((tenant) => ({
      id: `TENANT:${tenant.id}`,
      entityType: 'TENANT',
      entityId: tenant.id,
      title: tenant.tenantNumber,
      description: [
        tenant.status ? `Status: ${tenant.status}` : undefined,
        tenant.moveInDate ? `Move-in: ${tenant.moveInDate}` : undefined,
        tenant.moveOutDate ? `Move-out: ${tenant.moveOutDate}` : undefined,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.scoreTenant(query.query, tenant),
      metadata: {
        personId: tenant.personId,
        propertyId: tenant.propertyId,
        tenantNumber: tenant.tenantNumber,
        status: tenant.status,
        moveInDate: tenant.moveInDate,
        moveOutDate: tenant.moveOutDate,
      },
    }));
  }

  private scoreTenant(query: string, tenant: any): number {
    const normalizedQuery = query.toLowerCase();
    const tenantNumber = String(tenant.tenantNumber ?? '').toLowerCase();
    const status = String(tenant.status ?? '').toLowerCase();

    if (tenantNumber === normalizedQuery) {
      return 100;
    }

    if (tenantNumber.includes(normalizedQuery)) {
      return 80;
    }

    if (status === normalizedQuery || status.includes(normalizedQuery)) {
      return 60;
    }

    return 50;
  }
}
