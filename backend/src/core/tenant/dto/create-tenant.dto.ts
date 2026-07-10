import { TenantStatus } from '../types/tenant.types';

export class CreateTenantDto {
  personId!: string;
  propertyId!: string;
  tenantNumber!: string;
  status?: TenantStatus;
  moveInDate?: string;
  moveOutDate?: string;
}
