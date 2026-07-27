import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { PropertyRepository } from '../repositories/property.repository';
import { PropertyService } from './property.service';
import { Property, Space, Zone } from '../types/property.types';

describe('PropertyService integration contract', () => {
  let repository: jest.Mocked<PropertyRepository>;
  let service: PropertyService;

  beforeEach(() => {
    repository = {
      createProperty: jest.fn(),
      findPropertyById: jest.fn(),
      updateProperty: jest.fn(),
      listProperties: jest.fn(),
      createZone: jest.fn(),
      listZonesByProperty: jest.fn(),
      createSpace: jest.fn(),
      listSpacesByProperty: jest.fn(),
      getPortfolioCounts: jest.fn(),
    };

    service = new PropertyService(repository);
  });

  it('delegates property create, lookup, update and listing', async () => {
    const now = new Date('2026-07-27T00:00:00.000Z');

    const property: Property = {
      id: 'property-1',
      name: "Advaith's Nest",
      code: 'AN',
      propertyType: 'studio-residence',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const listed = {
      items: [property],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    repository.createProperty.mockResolvedValue(property);
    repository.findPropertyById.mockResolvedValue(property);
    repository.updateProperty.mockResolvedValue({
      ...property,
      name: "Advaith's Nest Pilot",
    });
    repository.listProperties.mockResolvedValue(listed);

    await expect(
      service.createProperty(property),
    ).resolves.toEqual(property);

    await expect(
      service.findPropertyById(property.id),
    ).resolves.toEqual(property);

    await expect(
      service.updateProperty(property.id, {
        name: "Advaith's Nest Pilot",
      }),
    ).resolves.toEqual({
      ...property,
      name: "Advaith's Nest Pilot",
    });

    await expect(
      service.listProperties({
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual(listed);

    expect(repository.createProperty).toHaveBeenCalledWith(property);
    expect(repository.findPropertyById).toHaveBeenCalledWith(property.id);
    expect(repository.updateProperty).toHaveBeenCalledWith(
      property.id,
      {
        name: "Advaith's Nest Pilot",
      },
    );
  });

  it('delegates zone and space lifecycle operations', async () => {
    const now = new Date('2026-07-27T00:00:00.000Z');

    const zone: Zone = {
      id: 'zone-1',
      propertyId: 'property-1',
      name: 'Ground Floor',
      code: 'GF',
      zoneType: 'floor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const space: Space = {
      id: 'space-1',
      propertyId: 'property-1',
      zoneId: 'zone-1',
      name: 'Room G01',
      code: 'G01',
      spaceType: 'studio-room',
      floor: 'Ground',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    repository.createZone.mockResolvedValue(zone);
    repository.listZonesByProperty.mockResolvedValue([zone]);
    repository.createSpace.mockResolvedValue(space);
    repository.listSpacesByProperty.mockResolvedValue([space]);

    await expect(
      service.createZone(zone),
    ).resolves.toEqual(zone);

    await expect(
      service.listZonesByProperty('property-1'),
    ).resolves.toEqual([zone]);

    await expect(
      service.createSpace(space),
    ).resolves.toEqual(space);

    await expect(
      service.listSpacesByProperty('property-1'),
    ).resolves.toEqual([space]);
  });

  it('returns portfolio counts from the repository', async () => {
    repository.getPortfolioCounts.mockResolvedValue({
      properties: 1,
      zones: 2,
      spaces: 22,
    });

    await expect(
      service.getPortfolioCounts(),
    ).resolves.toEqual({
      properties: 1,
      zones: 2,
      spaces: 22,
    });
  });
});
