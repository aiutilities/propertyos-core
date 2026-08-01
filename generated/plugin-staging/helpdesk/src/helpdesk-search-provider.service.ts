import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  SearchProviderRegistry,
} from '@propertyos/core-contracts';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '@propertyos/core-contracts';
import {
  HELPDESK_SEARCH_PROVIDER,
} from './helpdesk.constants';
import {
  HelpdeskService,
} from './services/helpdesk.service';

@Injectable()
export class HelpdeskSearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry:
      SearchProviderRegistry,
    private readonly helpdeskService:
      HelpdeskService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name:
        `${HELPDESK_SEARCH_PROVIDER}-search-provider`,
      entityType:
        HELPDESK_SEARCH_PROVIDER,
      search: (query) =>
        this.search(query),
    };

    this.registry.register(provider);
  }

  private async search(
    query: SearchQuery,
  ): Promise<SearchResult[]> {
    const search = query.query?.trim();

    if (!search) {
      return [];
    }

    const limit = query.limit ?? 25;

    const tickets =
      await this.helpdeskService.list({
        search,
      });

    return tickets
      .map((ticket): SearchResult => ({
        id: `helpdesk:${ticket.id}`,
        entityType:
          HELPDESK_SEARCH_PROVIDER,
        entityId: ticket.id,
        title: ticket.title,
        description: [
          ticket.ticketNumber,
          ticket.status,
          ticket.priority,
        ]
          .filter(Boolean)
          .join(' | '),
        score: 100,
        metadata: {
          ticketNumber:
            ticket.ticketNumber,
          propertyId:
            ticket.propertyId,
          spaceId:
            ticket.spaceId,
          categoryId:
            ticket.categoryId,
          requesterPersonId:
            ticket.requesterPersonId,
          assigneePersonId:
            ticket.assigneePersonId,
          priority:
            ticket.priority,
          status:
            ticket.status,
          channel:
            ticket.channel,
          responseDueAt:
            ticket.responseDueAt,
          resolutionDueAt:
            ticket.resolutionDueAt,
          createdAt:
            ticket.createdAt,
        },
      }))
      .slice(0, limit);
  }
}
