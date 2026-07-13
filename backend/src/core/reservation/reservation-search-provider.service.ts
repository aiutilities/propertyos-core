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
  RESERVATION_SEARCH_PROVIDER,
} from './reservation.constants';
import {
  ReservationService,
} from './services/reservation.service';

@Injectable()
export class ReservationSearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry:
      SearchProviderRegistry,
    private readonly reservationService:
      ReservationService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name:
        `${RESERVATION_SEARCH_PROVIDER}-search-provider`,
      entityType:
        RESERVATION_SEARCH_PROVIDER,
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

    const [resources, reservations] =
      await Promise.all([
        this.reservationService
          .listResources({ search }),
        this.reservationService
          .listReservations({ search }),
      ]);

    const resourceResults:
      SearchResult[] =
      resources.map((resource) => ({
        id:
          `reservation-resource:${resource.id}`,
        entityType:
          'reservation-resource',
        entityId: resource.id,
        title: resource.name,
        description: [
          resource.code,
          resource.resourceType,
          resource.isActive
            ? 'ACTIVE'
            : 'INACTIVE',
        ]
          .filter(Boolean)
          .join(' | '),
        score: 100,
        metadata: {
          propertyId:
            resource.propertyId,
          zoneId: resource.zoneId,
          spaceId: resource.spaceId,
          resourceType:
            resource.resourceType,
          capacity: resource.capacity,
          requiresApproval:
            resource.requiresApproval,
          isActive: resource.isActive,
        },
      }));

    const reservationResults:
      SearchResult[] =
      reservations.map(
        (reservation) => ({
          id:
            `reservation:${reservation.id}`,
          entityType:
            RESERVATION_SEARCH_PROVIDER,
          entityId: reservation.id,
          title:
            reservation.title,
          description: [
            reservation
              .reservationNumber,
            reservation.status,
            reservation.startAt
              .toISOString(),
          ]
            .filter(Boolean)
            .join(' | '),
          score: 100,
          metadata: {
            reservationNumber:
              reservation
                .reservationNumber,
            propertyId:
              reservation.propertyId,
            resourceId:
              reservation.resourceId,
            requesterPersonId:
              reservation
                .requesterPersonId,
            status:
              reservation.status,
            startAt:
              reservation.startAt,
            endAt:
              reservation.endAt,
          },
        }),
      );

    return [
      ...resourceResults,
      ...reservationResults,
    ].slice(0, limit);
  }
}
