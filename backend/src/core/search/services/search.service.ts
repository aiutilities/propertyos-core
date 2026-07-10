import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import { SearchProviderRegistry } from '../registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../types/search.types';

@Injectable()
export class SearchService {
  private readonly source = 'core.search';

  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const limit = this.normalizeLimit(query.limit);
    const offset = this.normalizeOffset(query.offset);

    await this.eventBus.publish('search.requested', this.source, {
      query: query.query,
      entityTypes: query.entityTypes ?? [],
      providerNames: query.providerNames ?? [],
      limit,
      offset,
    });

    const providers = this.filterProviders(
      this.registry.getByEntityTypes(query.entityTypes),
      query.providerNames,
    );

    const results: SearchResult[] = [];

    for (const provider of providers) {
      const providerResults = await provider.search({
        ...query,
        limit: limit + offset,
      });

      results.push(
        ...providerResults.map((result) => ({
          ...result,
          providerName: result.providerName ?? provider.name,
        })),
      );
    }

    return results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(offset, offset + limit);
  }

  providers(): SearchProvider[] {
    return this.registry.list();
  }

  private filterProviders(
    providers: SearchProvider[],
    providerNames?: string[],
  ): SearchProvider[] {
    if (!providerNames || providerNames.length === 0) {
      return providers;
    }

    return providers.filter((provider) =>
      providerNames.includes(provider.name),
    );
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || limit < 1) {
      return 25;
    }

    return Math.min(limit, 100);
  }

  private normalizeOffset(offset?: number): number {
    if (!offset || offset < 0) {
      return 0;
    }

    return offset;
  }
}
