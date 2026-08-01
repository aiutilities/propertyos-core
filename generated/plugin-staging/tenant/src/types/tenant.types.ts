export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'VACATED';

export interface Tenant {
  id: string;
  personId: string;
  propertyId: string;
  tenantNumber: string;
  status: TenantStatus;
  moveInDate?: Date;
  moveOutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSpace {
  id: string;
  tenantId: string;
  spaceId: string;
  assignedAt: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
