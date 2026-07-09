export interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  spaceId?: string;
  leaseNumber: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  status: string;
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
