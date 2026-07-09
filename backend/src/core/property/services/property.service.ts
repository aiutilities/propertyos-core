import { Inject, Injectable } from '@nestjs/common';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { PropertyRepository } from '../repositories/property.repository';
import { Property, Space, Zone } from '../types/property.types';

export const PROPERTY_REPOSITORY = 'PROPERTY_REPOSITORY';

@Injectable()
export class PropertyService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  createProperty(property: Property): Promise<Property> {
    return this.propertyRepository.createProperty(property);
  }

  findPropertyById(id: string): Promise<Property | null> {
    return this.propertyRepository.findPropertyById(id);
  }

  updateProperty(
    id: string,
    input: Partial<Property>,
  ): Promise<Property | null> {
    return this.propertyRepository.updateProperty(id, input);
  }

  listProperties(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Property>> {
    return this.propertyRepository.listProperties(query);
  }

  createZone(zone: Zone): Promise<Zone> {
    return this.propertyRepository.createZone(zone);
  }

  listZonesByProperty(propertyId: string): Promise<Zone[]> {
    return this.propertyRepository.listZonesByProperty(propertyId);
  }

  createSpace(space: Space): Promise<Space> {
    return this.propertyRepository.createSpace(space);
  }

  listSpacesByProperty(propertyId: string): Promise<Space[]> {
    return this.propertyRepository.listSpacesByProperty(propertyId);
  }
}
