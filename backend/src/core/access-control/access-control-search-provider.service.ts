import { Injectable, OnModuleInit } from "@nestjs/common";

import { SearchProviderRegistry } from "../search/registries/search-provider.registry";
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from "../search/types/search.types";
import { ACCESS_CONTROL_SEARCH_PROVIDER } from "./access-control.constants";
import { AccessControlService } from "./services/access-control.service";

@Injectable()
export class AccessControlSearchProviderService implements OnModuleInit {
  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly accessControlService: AccessControlService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: `${ACCESS_CONTROL_SEARCH_PROVIDER}-search-provider`,
      entityType: ACCESS_CONTROL_SEARCH_PROVIDER,
      search: (query) => this.search(query),
    };

    this.registry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const accessPoints = await this.accessControlService.listAccessPoints({
      search: query.query,
    });

    return accessPoints.slice(0, query.limit ?? 25).map((accessPoint) => ({
      id: `access-point:${accessPoint.id}`,
      entityType: ACCESS_CONTROL_SEARCH_PROVIDER,
      entityId: accessPoint.id,
      title: accessPoint.name,
      description: [
        accessPoint.code,
        accessPoint.accessPointType,
        accessPoint.direction,
        accessPoint.status,
      ]
        .filter(Boolean)
        .join(" | "),
      score: 100,
      metadata: {
        propertyId: accessPoint.propertyId,
        zoneId: accessPoint.zoneId,
        spaceId: accessPoint.spaceId,
        code: accessPoint.code,
        accessPointType: accessPoint.accessPointType,
        direction: accessPoint.direction,
        status: accessPoint.status,
        requiresAntiPassback: accessPoint.requiresAntiPassback,
      },
    }));
  }
}
