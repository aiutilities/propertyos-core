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

    const runtimePlugins = await this.pluginService.list();
    const installedPlugins = await this.pluginService.installedPlugins();

    const plugins = [
      ...runtimePlugins,
      ...installedPlugins.map((plugin: any) => ({
        id: plugin.id,
        name: plugin.name,
        displayName: plugin.displayName,
        version: plugin.version,
        provider: plugin.author ?? 'unknown',
        status: plugin.status,
        installed: true,
        installedPluginId: plugin.id,
        installedStatus: plugin.status,
        description: plugin.description,
      })),
    ];

    const normalizedQuery = query.query.toLowerCase();

    return plugins
      .filter((plugin: any) => {
        const name = String(plugin.name ?? '').toLowerCase();
        const displayName = String(plugin.displayName ?? '').toLowerCase();
        const provider = String(plugin.provider ?? '').toLowerCase();
        const status = String(plugin.status ?? '').toLowerCase();
        const installedStatus = String(plugin.installedStatus ?? '').toLowerCase();
        const description = String(plugin.description ?? '').toLowerCase();

        return (
          name.includes(normalizedQuery) ||
          displayName.includes(normalizedQuery) ||
          provider.includes(normalizedQuery) ||
          status.includes(normalizedQuery) ||
          installedStatus.includes(normalizedQuery) ||
          description.includes(normalizedQuery)
        );
      })
      .map((plugin: any) => ({
        id: `PLUGIN:${plugin.id}`,
        entityType: 'PLUGIN',
        entityId: plugin.id,
        title: plugin.displayName ?? plugin.name,
        description: [
          plugin.name,
          plugin.version,
          plugin.provider,
          plugin.status,
          plugin.installedStatus,
        ]
          .filter(Boolean)
          .join(' | '),
        score: this.scorePlugin(query.query, plugin),
        metadata: {
          name: plugin.name,
          displayName: plugin.displayName,
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
    const displayName = String(plugin.displayName ?? '').toLowerCase();

    if (name === normalizedQuery || displayName === normalizedQuery) {
      return 100;
    }

    if (name.includes(normalizedQuery) || displayName.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
