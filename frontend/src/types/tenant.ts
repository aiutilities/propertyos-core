export interface Tenant {
  id: string;
  personId: string;
  propertyId: string;
  tenantNumber: string;
  status: string;
  moveInDate?: string;
  moveOutDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantListResponse {
  success: boolean;
  data: {
    items: Tenant[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
