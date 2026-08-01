export enum AssetStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RETIRED = 'RETIRED',
  DISPOSED = 'DISPOSED',
}

export enum AssetCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED',
}

export enum PreventiveMaintenanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityAsset {
  id: string;
  assetNumber: string;
  name: string;
  description?: string;
  categoryId: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  qrToken: string;
  status: AssetStatus;
  condition: AssetCondition;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiresAt?: Date;
  vendorName?: string;
  vendorContact?: string;
  installedAt?: Date;
  retiredAt?: Date;
  disposedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityAssetHistory {
  id: string;
  assetId: string;
  fromStatus?: AssetStatus;
  toStatus: AssetStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
}

export interface PreventiveMaintenancePlan {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  frequency: PreventiveMaintenanceFrequency;
  intervalDays?: number;
  nextDueAt: Date;
  lastCompletedAt?: Date;
  assignedPersonId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityAssetDetails extends FacilityAsset {
  category?: AssetCategory;
  history: FacilityAssetHistory[];
  preventivePlans: PreventiveMaintenancePlan[];
}

export interface FacilityAssetFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  categoryId?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  search?: string;
}
