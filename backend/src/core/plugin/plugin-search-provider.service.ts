import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { PluginService } from './services/plugin.service';

@Injectable()
export class PluginSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly pluginService: PluginService,
  ) {}

  onModuleInit(): void {
    this.searchProviderRegistry.register({
      name: 'core-plugin-search',
      entityType: 'PLUGIN',
      search: (query) => this.search(query),
    });
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const plugins = await this.pluginService.list();
    const normalizedQuery = query.query.toLowerCase();

    return plugins
      .filter((plugin: any) => {
        const name = String(plugin.name ?? '').toLowerCase();
        const provider = String(plugin.provider ?? '').toLowerCase();
        const status = String(plugin.status ?? '').toLowerCase();
        const installedStatus = String(plugin.installedStatus ?? '').toLowerCase();

        return (
          name.includes(normalizedQuery) ||
          provider.includes(normalizedQuery) ||
          status.includes(normalizedQuery) ||
          installedStatus.includes(normalizedQuery)
        );
      })
      .map((plugin: any) => ({
        id: `PLUGIN:${plugin.id}`,
        entityType: 'PLUGIN',
        entityId: plugin.id,
        title: plugin.name,
        description: [
          plugin.version,
          plugin.provider,
          plugin.status,
          plugin.installedStatus,
        ]
          .filter(Boolean)
          .join(' | '),
        score: this.scorePlugin(query.query, plugin),
        metadata: {
          version: plugin.version,
          provider: plugin.provider,
          enabled: plugin.enabled,
          status: plugin.status,
          installed: plugin.installed,
          installedPluginId: plugin.installedPluginId,
          installedStatus: plugin.installedStatus,
        },
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, query.limit ?? 25);
  }

  private scorePlugin(query: string, plugin: any): number {
    const normalizedQuery = query.toLowerCase();
    const name = String(plugin.name ?? '').toLowerCase();

    if (name === normalizedQuery) {
      return 100;
    }

    if (name.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
