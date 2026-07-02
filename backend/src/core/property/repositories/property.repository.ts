import { Property, Space, Zone } from '../types/property.types';

export interface PropertyRepository {
  createProperty(property: Property): Promise<Property>;
  findPropertyById(id: string): Promise<Property | null>;
  listProperties(): Promise<Property[]>;

  createZone(zone: Zone): Promise<Zone>;
  listZonesByProperty(propertyId: string): Promise<Zone[]>;

  createSpace(space: Space): Promise<Space>;
  listSpacesByProperty(propertyId: string): Promise<Space[]>;
}
