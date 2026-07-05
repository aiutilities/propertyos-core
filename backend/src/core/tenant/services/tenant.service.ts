import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

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
  ) {}

  async createTenant(
    input: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Tenant> {
    return this.tenantRepository.createTenant({
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
    return this.tenantRepository.assignSpace({
      id: randomUUID(),
      tenantId,
      spaceId,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async listTenantSpaces(
    tenantId: string,
  ): Promise<TenantSpace[]> {
    return this.tenantRepository.listTenantSpaces(tenantId);
  }
}
