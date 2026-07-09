export interface Lease {
  id: string;
  tenantId: string;
  leaseNumber: string;
  currentVersionId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaseListResponse {
  success: boolean;
  data: {
    items: Lease[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
