import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { PropertyService } from './services/property.service';

@Injectable()
export class PropertySearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly propertyService: PropertyService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'core-property-search',
      entityType: 'PROPERTY',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const result = await this.propertyService.listProperties({
      search: query.query,
      limit: query.limit ?? 25,
    });

    return result.items.map((property) => ({
      id: `PROPERTY:${property.id}`,
      entityType: 'PROPERTY',
      entityId: property.id,
      title: property.name,
      description: [
        property.code,
        property.propertyType,
        property.city,
        property.state,
        property.country,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.scoreProperty(query.query, property),
      metadata: {
        code: property.code,
        propertyType: property.propertyType,
        city: property.city,
        state: property.state,
        country: property.country,
        isActive: property.isActive,
      },
    }));
  }

  private scoreProperty(query: string, property: any): number {
    const normalizedQuery = query.toLowerCase();
    const name = String(property.name ?? '').toLowerCase();
    const code = String(property.code ?? '').toLowerCase();

    if (name === normalizedQuery || code === normalizedQuery) {
      return 100;
    }

    if (name.includes(normalizedQuery) || code.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
