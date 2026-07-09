export interface Tenant {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: string;
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
