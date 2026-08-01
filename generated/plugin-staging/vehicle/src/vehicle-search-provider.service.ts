import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { SearchProviderRegistry } from '@propertyos/core-contracts';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '@propertyos/core-contracts';
import { VehicleService } from './services/vehicle.service';

@Injectable()
export class VehicleSearchProviderService
  implements OnModuleInit
{
  constructor(
    private readonly registry:
      SearchProviderRegistry,
    private readonly vehicleService:
      VehicleService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'vehicle-search-provider',
      entityType: 'vehicle',
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

    const vehicles =
      await this.vehicleService.search(
        query.query,
        query.limit ?? 25,
      );

    return vehicles.map((vehicle) => ({
      id: `vehicle:${vehicle.id}`,
      entityType: 'vehicle',
      entityId: vehicle.id,
      title: vehicle.registrationNumber,
      description: [
        vehicle.vehicleType,
        vehicle.make,
        vehicle.model,
        vehicle.colour,
        vehicle.status,
      ]
        .filter(Boolean)
        .join(' | '),
      score: 100,
      metadata: {
        propertyId: vehicle.propertyId,
        spaceId: vehicle.spaceId,
        ownerPersonId:
          vehicle.ownerPersonId,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status,
        parkingSlot: vehicle.parkingSlot,
        rfidTag: vehicle.rfidTag,
      },
    }));
  }
}
