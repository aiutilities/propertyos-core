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
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  propertyId: string;
  name: string;
  code?: string;
  zoneType?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Space {
  id: string;
  propertyId: string;
  zoneId?: string;
  name: string;
  code?: string;
  spaceType?: string;
  floor?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
