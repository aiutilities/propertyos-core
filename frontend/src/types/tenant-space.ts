export interface TenantSpace {
  id: string;
  tenantId: string;
  spaceId: string;
  assignedAt: string;
  releasedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSpacesResponse {
  success: boolean;
  data: TenantSpace[];
}
