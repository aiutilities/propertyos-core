import { Injectable } from '@nestjs/common';
import { SearchProvider } from '../types/search.types';

@Injectable()
export class SearchProviderRegistry {
  private readonly providers = new Map<string, SearchProvider>();

  register(provider: SearchProvider): void {
    this.providers.set(provider.name, provider);
  }

  list(): SearchProvider[] {
    return [...this.providers.values()];
  }

  getByEntityTypes(entityTypes?: string[]): SearchProvider[] {
    const providers = this.list();

    if (!entityTypes || entityTypes.length === 0) {
      return providers;
    }

    return providers.filter((provider) =>
      entityTypes.includes(provider.entityType),
    );
  }
}
