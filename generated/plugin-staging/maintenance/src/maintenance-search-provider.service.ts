import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '@propertyos/core-contracts';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '@propertyos/core-contracts';

import { MaintenanceService } from './services/maintenance.service';

@Injectable()
export class MaintenanceSearchProviderService implements OnModuleInit {
  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'maintenance-search-provider',
      entityType: 'maintenance.ticket',
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

    const tickets = await this.maintenanceService.search(
      query.query,
      query.limit ?? 25,
    );

    return tickets.map((ticket: any) => ({
      id: `maintenance.ticket:${ticket.id}`,
      entityType: 'maintenance.ticket',
      entityId: ticket.id,
      title: ticket.ticketNumber,
      description: [
        ticket.title,
        ticket.status,
        ticket.priority,
      ]
        .filter(Boolean)
        .join(" | "),
      score: 100,
      metadata: {
        propertyId: ticket.propertyId,
        assigneePersonId: ticket.assigneePersonId,
        reporterPersonId: ticket.reporterPersonId,
        status: ticket.status,
        priority: ticket.priority,
      },
    }));
  }
}
