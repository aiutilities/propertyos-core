import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import {
  TENANT_REPOSITORY,
  TenantRepository,
} from '../repositories/tenant-repository.interface';

import { Tenant, TenantSpace } from '../types/tenant.types';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async createTenant(
    input: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.createTenant({
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'tenant.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Tenant created',
        message: `Tenant created successfully: ${tenant.id}`,
        metadata: {
          domainEventType: 'TENANT_CREATED',
          tenantId: tenant.id,
          personId: tenant.personId,
        },
      },
    );

    return tenant;
  }

  async listTenants(): Promise<Tenant[]> {
    return this.tenantRepository.listTenants();
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenantRepository.findTenantById(id);
  }

  async assignSpace(
    tenantId: string,
    spaceId: string,
  ): Promise<TenantSpace> {
    const tenantSpace = await this.tenantRepository.assignSpace({
      id: randomUUID(),
      tenantId,
      spaceId,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'tenant.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Space assigned',
        message: `Space assigned to tenant: ${tenantId}`,
        metadata: {
          domainEventType: 'TENANT_SPACE_ASSIGNED',
          tenantId,
          spaceId,
          tenantSpaceId: tenantSpace.id,
        },
      },
    );

    return tenantSpace;
  }

  async listTenantSpaces(
    tenantId: string,
  ): Promise<TenantSpace[]> {
    return this.tenantRepository.listTenantSpaces(tenantId);
  }
}
