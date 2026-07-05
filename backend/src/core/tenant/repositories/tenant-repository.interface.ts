import { Tenant, TenantSpace } from '../types/tenant.types';

export const TENANT_REPOSITORY = 'TENANT_REPOSITORY';

export interface TenantRepository {
  createTenant(tenant: Tenant): Promise<Tenant>;

  listTenants(): Promise<Tenant[]>;

  findTenantById(id: string): Promise<Tenant | undefined>;

  assignSpace(tenantSpace: TenantSpace): Promise<TenantSpace>;

  listTenantSpaces(tenantId: string): Promise<TenantSpace[]>;
}
