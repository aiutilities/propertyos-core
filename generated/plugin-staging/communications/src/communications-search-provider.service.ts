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
  COMMUNICATIONS_SEARCH_PROVIDER,
} from './communications.constants';

import {
  CommunicationsService,
} from './services/communications.service';

@Injectable()
export class CommunicationsSearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry:
      SearchProviderRegistry,
    private readonly communicationsService:
      CommunicationsService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name:
        `${COMMUNICATIONS_SEARCH_PROVIDER}-search-provider`,
      entityType:
        COMMUNICATIONS_SEARCH_PROVIDER,
      search:
        (query) =>
          this.search(query),
    };

    this.registry.register(provider);
  }

  private async search(
    query: SearchQuery,
  ): Promise<SearchResult[]> {
    const search =
      query.query?.trim();

    if (!search) {
      return [];
    }

    const limit =
      query.limit ?? 25;

    const communications =
      await this.communicationsService.list({
        search,
      });

    return communications
      .map(
        (
          communication,
        ): SearchResult => ({
          id:
            `communications:${communication.id}`,
          entityType:
            COMMUNICATIONS_SEARCH_PROVIDER,
          entityId:
            communication.id,
          title:
            communication.title,
          description: [
            communication.communicationNumber,
            communication.type,
            communication.priority,
            communication.status,
            communication.summary,
          ]
            .filter(Boolean)
            .join(' | '),
          score: 100,
          metadata: {
            communicationNumber:
              communication.communicationNumber,
            propertyId:
              communication.propertyId,
            categoryId:
              communication.categoryId,
            type:
              communication.type,
            priority:
              communication.priority,
            status:
              communication.status,
            isPinned:
              communication.isPinned,
            requiresAcknowledgement:
              communication.requiresAcknowledgement,
            publishAt:
              communication.publishAt,
            publishedAt:
              communication.publishedAt,
            expiresAt:
              communication.expiresAt,
            createdAt:
              communication.createdAt,
          },
        }),
      )
      .slice(0, limit);
  }
}
