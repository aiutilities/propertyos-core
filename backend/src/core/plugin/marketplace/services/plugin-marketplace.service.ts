import { Injectable } from '@nestjs/common';
import { RegisterMarketplacePluginDto } from '../dto/register-marketplace-plugin.dto';
import { SearchMarketplaceDto } from '../dto/search-marketplace.dto';
import {
  MarketplacePlugin,
  MarketplaceSearchResult,
} from '../types/plugin-marketplace.types';

@Injectable()
export class PluginMarketplaceService {
  private readonly plugins = new Map<string, MarketplacePlugin>();

  register(dto: RegisterMarketplacePluginDto): MarketplacePlugin {
    this.plugins.set(dto.plugin.id, dto.plugin);
    return dto.plugin;
  }

  list(): MarketplacePlugin[] {
    return [...this.plugins.values()];
  }

  get(id: string): MarketplacePlugin | undefined {
    return this.plugins.get(id);
  }

  search(dto: SearchMarketplaceDto): MarketplaceSearchResult {
    const query = dto.query?.toLowerCase();
    const category = dto.category?.toLowerCase();
    const tag = dto.tag?.toLowerCase();

    const items = this.list().filter((plugin) => {
      const matchesQuery =
        !query ||
        plugin.name.toLowerCase().includes(query) ||
        plugin.provider.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query);

      const matchesCategory =
        !category || plugin.category?.toLowerCase() === category;

      const matchesTag =
        !tag || plugin.tags.map((item) => item.toLowerCase()).includes(tag);

      return matchesQuery && matchesCategory && matchesTag;
    });

    return {
      total: items.length,
      items,
    };
  }
}
