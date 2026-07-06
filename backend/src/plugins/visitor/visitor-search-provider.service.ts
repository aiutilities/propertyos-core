import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../../core/search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../../core/search/types/search.types';
import { VisitorService } from './visitor.service';

@Injectable()
export class VisitorSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly visitorService: VisitorService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'visitor-search-provider',
      entityType: 'visitor.visit',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const visits = await this.visitorService.searchVisits(
      query.query,
      query.limit ?? 25,
    );

    return visits.map((visit: any) => ({
      id: `visitor.visit:${visit.id}`,
      entityType: 'visitor.visit',
      entityId: visit.id,
      title: visit.visitor?.fullName ?? 'Visitor Visit',
      description: [
        visit.visitPurpose,
        visit.status ? `Status: ${visit.status}` : undefined,
        visit.visitor?.mobile ? `Mobile: ${visit.visitor.mobile}` : undefined,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.scoreVisit(query.query, visit),
      metadata: {
        visitorId: visit.visitorId,
        propertyId: visit.propertyId,
        hostPersonId: visit.hostPersonId,
        visitDate: visit.visitDate,
        status: visit.status,
      },
    }));
  }

  private scoreVisit(query: string, visit: any): number {
    const normalizedQuery = query.toLowerCase();
    const visitorName = String(visit.visitor?.fullName ?? '').toLowerCase();
    const visitorMobile = String(visit.visitor?.mobile ?? '').toLowerCase();

    if (visitorName === normalizedQuery || visitorMobile === normalizedQuery) {
      return 100;
    }

    if (
      visitorName.includes(normalizedQuery) ||
      visitorMobile.includes(normalizedQuery)
    ) {
      return 80;
    }

    return 50;
  }
}
