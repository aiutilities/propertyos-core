export interface Zone {
  id: string;
  propertyId: string;
  name: string;
  code?: string;
  zoneType?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneResponse {
  success: boolean;
  data: Zone[];
}
