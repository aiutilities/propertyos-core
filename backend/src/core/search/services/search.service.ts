import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { SearchProviderRegistry } from '../registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../types/search.types';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly source = 'core.search';

  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit(): void {
    this.registerCoreProviders();
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    await this.eventBus.publish('search.requested', this.source, {
      query: query.query,
      entityTypes: query.entityTypes ?? [],
    });

    const providers = this.registry.getByEntityTypes(query.entityTypes);
    const results: SearchResult[] = [];

    for (const provider of providers) {
      const providerResults = await provider.search(query);
      results.push(...providerResults);
    }

    const limit = query.limit ?? 25;

    return results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  providers(): SearchProvider[] {
    return this.registry.list();
  }

  private registerCoreProviders(): void {
    this.registry.register({
      name: 'core-document-search',
      entityType: 'DOCUMENT',
      search: async (query) => this.simplePlaceholderSearch(query, 'DOCUMENT'),
    });

    this.registry.register({
      name: 'core-plugin-search',
      entityType: 'PLUGIN',
      search: async (query) => this.simplePlaceholderSearch(query, 'PLUGIN'),
    });
  }

  private async simplePlaceholderSearch(
    query: SearchQuery,
    entityType: string,
  ): Promise<SearchResult[]> {
    if (!query.query || query.query.trim().length === 0) {
      return [];
    }

    return [];
  }
}
