import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';

import { Property, Space, Zone } from '../types/property.types';

export interface PropertyRepository {
  createProperty(property: Property): Promise<Property>;

  findPropertyById(id: string): Promise<Property | null>;

  updateProperty(id: string, input: Partial<Property>): Promise<Property | null>;

  listProperties(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Property>>;

  createZone(zone: Zone): Promise<Zone>;

  listZonesByProperty(propertyId: string): Promise<Zone[]>;

  createSpace(space: Space): Promise<Space>;

  listSpacesByProperty(propertyId: string): Promise<Space[]>;

  getPortfolioCounts(): Promise<{
    properties: number;
    zones: number;
    spaces: number;
  }>;
}
