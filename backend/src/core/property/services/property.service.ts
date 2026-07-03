import { Inject, Injectable } from '@nestjs/common';
import { Property, Space, Zone } from '../types/property.types';
import { PropertyRepository } from '../repositories/property.repository';

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

  listProperties(): Promise<Property[]> {
    return this.propertyRepository.listProperties();
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
