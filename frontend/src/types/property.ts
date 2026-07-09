export interface Property {
  id: string;
  name: string;
  code: string;
  propertyType: string;
  city?: string;
  state?: string;
  country?: string;
  isActive: boolean;
}

export interface PropertyListResponse {
  success: boolean;
  data: {
    items: Property[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
