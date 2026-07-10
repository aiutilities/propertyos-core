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
}

export interface SpaceResponse {
  success: boolean;
  data: Space[];
}
