import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import { TenantRepository } from '../repositories/tenant-repository.interface';
import { Tenant, TenantSpace } from '../types/tenant.types';
import { TenantService } from './tenant.service';

describe('TenantService integration contract', () => {
  let repository: jest.Mocked<TenantRepository>;
  let eventBusService: jest.Mocked<EventBusService>;
  let service: TenantService;

  beforeEach(() => {
    repository = {
      createTenant: jest.fn(),
      listTenants: jest.fn(),
      listTenantsPaginated: jest.fn(),
      findTenantById: jest.fn(),
      assignSpace: jest.fn(),
      listTenantSpaces: jest.fn(),
      getOccupancyCounts: jest.fn(),
    };

    eventBusService = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBusService>;

    eventBusService.publish.mockResolvedValue(undefined);

    service = new TenantService(
      repository,
      eventBusService,
    );
  });

  it('creates a tenant and publishes the tenant-created notification', async () => {
    const input = {
      personId: 'person-1',
      propertyId: 'property-1',
      tenantNumber: 'TENANT-001',
      status: 'ACTIVE' as const,
      moveInDate: new Date(
        '2026-07-27T00:00:00.000Z',
      ),
    };

    repository.createTenant.mockImplementation(
      async (tenant: Tenant) => tenant,
    );

    const result = await service.createTenant(input);

    expect(result).toEqual(
      expect.objectContaining({
        personId: input.personId,
        propertyId: input.propertyId,
        tenantNumber: input.tenantNumber,
        status: 'ACTIVE',
        moveInDate: input.moveInDate,
      }),
    );

    expect(result.id).toEqual(
      expect.any(String),
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);

    expect(repository.createTenant).toHaveBeenCalledTimes(1);
    expect(repository.createTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        personId: input.personId,
        propertyId: input.propertyId,
        tenantNumber: input.tenantNumber,
        status: 'ACTIVE',
      }),
    );

    expect(eventBusService.publish).toHaveBeenCalledWith(
      'NOTIFICATION_REQUESTED',
      'tenant.service',
      expect.objectContaining({
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Tenant created',
        metadata: expect.objectContaining({
          domainEventType: 'TENANT_CREATED',
          tenantId: result.id,
          personId: input.personId,
        }),
      }),
    );
  });

  it('delegates tenant listing, pagination and lookup', async () => {
    const now = new Date(
      '2026-07-27T00:00:00.000Z',
    );

    const tenant: Tenant = {
      id: 'tenant-1',
      personId: 'person-1',
      propertyId: 'property-1',
      tenantNumber: 'TENANT-001',
      status: 'ACTIVE',
      moveInDate: now,
      createdAt: now,
      updatedAt: now,
    };

    const paginated = {
      items: [tenant],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    repository.listTenants.mockResolvedValue([tenant]);
    repository.listTenantsPaginated.mockResolvedValue(
      paginated,
    );
    repository.findTenantById.mockResolvedValue(tenant);

    await expect(
      service.listTenants(),
    ).resolves.toEqual([tenant]);

    await expect(
      service.listTenantsPaginated({
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual(paginated);

    await expect(
      service.getTenant(tenant.id),
    ).resolves.toEqual(tenant);

    expect(
      repository.listTenantsPaginated,
    ).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });

    expect(
      repository.findTenantById,
    ).toHaveBeenCalledWith(tenant.id);
  });

  it('assigns a space and publishes the assignment notification', async () => {
    const now = new Date(
      '2026-07-27T00:00:00.000Z',
    );

    repository.assignSpace.mockImplementation(
      async (
        tenantSpace: TenantSpace,
      ) => tenantSpace,
    );

    const result = await service.assignSpace(
      'tenant-1',
      'space-1',
    );

    expect(result).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-1',
        spaceId: 'space-1',
      }),
    );

    expect(result.id).toEqual(
      expect.any(String),
    );
    expect(result.assignedAt).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);

    expect(repository.assignSpace).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        spaceId: 'space-1',
      }),
    );

    expect(eventBusService.publish).toHaveBeenCalledWith(
      'NOTIFICATION_REQUESTED',
      'tenant.service',
      expect.objectContaining({
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Space assigned',
        metadata: expect.objectContaining({
          domainEventType: 'TENANT_SPACE_ASSIGNED',
          tenantId: 'tenant-1',
          spaceId: 'space-1',
          tenantSpaceId: result.id,
        }),
      }),
    );

    expect(now).toBeInstanceOf(Date);
  });

  it('delegates tenant-space listing and occupancy counts', async () => {
    const now = new Date(
      '2026-07-27T00:00:00.000Z',
    );

    const tenantSpace: TenantSpace = {
      id: 'tenant-space-1',
      tenantId: 'tenant-1',
      spaceId: 'space-1',
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    repository.listTenantSpaces.mockResolvedValue([
      tenantSpace,
    ]);

    repository.getOccupancyCounts.mockResolvedValue({
      activeTenants: 18,
      occupiedSpaces: 18,
    });

    await expect(
      service.listTenantSpaces('tenant-1'),
    ).resolves.toEqual([tenantSpace]);

    await expect(
      service.getOccupancyCounts(),
    ).resolves.toEqual({
      activeTenants: 18,
      occupiedSpaces: 18,
    });

    expect(
      repository.listTenantSpaces,
    ).toHaveBeenCalledWith('tenant-1');

    expect(
      repository.getOccupancyCounts,
    ).toHaveBeenCalledTimes(1);
  });
});
