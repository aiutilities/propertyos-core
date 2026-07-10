export interface Property {
  id: string;
  name: string;
  code?: string;
  propertyType?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
