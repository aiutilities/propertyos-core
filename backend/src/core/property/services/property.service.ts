import { Injectable } from '@nestjs/common';
import { Property, Space, Zone } from '../types/property.types';

@Injectable()
export class PropertyService {
  private readonly properties: Property[] = [];
  private readonly zones: Zone[] = [];
  private readonly spaces: Space[] = [];

  createProperty(property: Property): Property {
    this.properties.push(property);
    return property;
  }

  findPropertyById(id: string): Property | null {
    return this.properties.find((property) => property.id === id) || null;
  }

  listProperties(): Property[] {
    return this.properties;
  }

  createZone(zone: Zone): Zone {
    this.zones.push(zone);
    return zone;
  }

  listZonesByProperty(propertyId: string): Zone[] {
    return this.zones.filter((zone) => zone.propertyId === propertyId);
  }

  createSpace(space: Space): Space {
    this.spaces.push(space);
    return space;
  }

  listSpacesByProperty(propertyId: string): Space[] {
    return this.spaces.filter((space) => space.propertyId === propertyId);
  }
}
