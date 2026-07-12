import { Injectable, OnModuleInit } from "@nestjs/common";

import { SearchProviderRegistry } from "../search/registries/search-provider.registry";
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from "../search/types/search.types";
import { StaffService } from "./services/staff.service";
import { STAFF_SEARCH_PROVIDER } from "./staff.constants";

@Injectable()
export class StaffSearchProviderService implements OnModuleInit {
  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly staffService: StaffService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: `${STAFF_SEARCH_PROVIDER}-search-provider`,
      entityType: STAFF_SEARCH_PROVIDER,
      search: (query) => this.search(query),
    };

    this.registry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const staffMembers = await this.staffService.search(
      query.query,
      query.limit ?? 25,
    );

    return staffMembers.map((staff) => ({
      id: `staff:${staff.id}`,
      entityType: STAFF_SEARCH_PROVIDER,
      entityId: staff.id,
      title: staff.employeeCode,
      description: [
        staff.staffType,
        staff.designation,
        staff.department,
        staff.employerName,
        staff.status,
      ]
        .filter(Boolean)
        .join(" | "),
      score: 100,
      metadata: {
        propertyId: staff.propertyId,
        zoneId: staff.zoneId,
        personId: staff.personId,
        staffType: staff.staffType,
        status: staff.status,
        shiftName: staff.shiftName,
        idCardNumber: staff.idCardNumber,
        rfidTag: staff.rfidTag,
      },
    }));
  }
}
