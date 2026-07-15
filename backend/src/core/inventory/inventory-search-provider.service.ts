import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  SearchProviderRegistry,
} from '../search/registries/search-provider.registry';

import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';

import {
  InventoryService,
} from './services/inventory.service';

@Injectable()
export class InventorySearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry:
      SearchProviderRegistry,

    private readonly inventoryService:
      InventoryService,
  ) {}

  onModuleInit(): void {
    const provider:
      SearchProvider = {
        name:
          'inventory-item-search-provider',

        entityType:
          'inventory.item',

        search:
          (query) =>
            this.search(query),
      };

    this.registry.register(
      provider,
    );
  }

  private async search(
    query: SearchQuery,
  ): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const items =
      await this.inventoryService
        .searchItems(
          query.query,
          query.limit ?? 25,
        );

    return items.map(
      (item) => ({
        id:
          `inventory.item:${item.id}`,

        entityType:
          'inventory.item',

        entityId:
          item.id,

        title:
          `${item.sku} — ${item.name}`,

        description:
          [
            item.description,
            `Type: ${item.itemType}`,
            `Status: ${
              item.isActive
                ? 'ACTIVE'
                : 'INACTIVE'
            }`,
            item.barcode
              ? `Barcode: ${item.barcode}`
              : undefined,
          ]
            .filter(Boolean)
            .join(' | '),

        score:
          this.score(
            query.query,
            item,
          ),

        metadata: {
          sku:
            item.sku,

          categoryId:
            item.categoryId,

          unitOfMeasureId:
            item.unitOfMeasureId,

          brandId:
            item.brandId,

          itemType:
            item.itemType,

          barcode:
            item.barcode,

          isActive:
            item.isActive,
        },
      }),
    );
  }

  private score(
    query: string,
    item: {
      sku: string;
      name: string;
      barcode?: string;
      manufacturerPartNumber?: string;
    },
  ): number {
    const normalized =
      query
        .trim()
        .toLowerCase();

    const exactValues = [
      item.sku,
      item.name,
      item.barcode,
      item.manufacturerPartNumber,
    ].map(
      (value) =>
        String(
          value ?? '',
        ).toLowerCase(),
    );

    if (
      exactValues.includes(
        normalized,
      )
    ) {
      return 100;
    }

    if (
      exactValues.some(
        (value) =>
          value.includes(
            normalized,
          ),
      )
    ) {
      return 80;
    }

    return 50;
  }
}
