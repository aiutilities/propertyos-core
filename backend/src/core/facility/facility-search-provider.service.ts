import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { FacilityService } from './services/facility.service';

@Injectable()
export class FacilitySearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly facilityService: FacilityService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'facility-asset-search-provider',
      entityType: 'facility.asset',
      search: (query) => this.search(query),
    };

    this.registry.register(provider);
  }

  private async search(
    query: SearchQuery,
  ): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const assets = await this.facilityService.search(
      query.query,
      query.limit ?? 25,
    );

    return assets.map((asset) => ({
      id: `facility.asset:${asset.id}`,
      entityType: 'facility.asset',
      entityId: asset.id,
      title: `${asset.assetNumber} — ${asset.name}`,
      description: [
        asset.manufacturer,
        asset.model,
        asset.serialNumber,
        `Status: ${asset.status}`,
        `Condition: ${asset.condition}`,
      ]
        .filter(Boolean)
        .join(' | '),
      score: this.score(query.query, asset),
      metadata: {
        assetNumber: asset.assetNumber,
        categoryId: asset.categoryId,
        propertyId: asset.propertyId,
        zoneId: asset.zoneId,
        spaceId: asset.spaceId,
        status: asset.status,
        condition: asset.condition,
        qrToken: asset.qrToken,
      },
    }));
  }

  private score(query: string, asset: any): number {
    const normalized = query.toLowerCase();

    const exactValues = [
      asset.assetNumber,
      asset.name,
      asset.serialNumber,
    ].map((value) =>
      String(value ?? '').toLowerCase(),
    );

    if (exactValues.includes(normalized)) {
      return 100;
    }

    if (
      exactValues.some((value) =>
        value.includes(normalized),
      )
    ) {
      return 80;
    }

    return 50;
  }
}
