export type AssetStatus =
  | "DRAFT"
  | "ACTIVE"
  | "IN_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED"
  | "DISPOSED";

export type AssetCondition =
  | "NEW"
  | "GOOD"
  | "FAIR"
  | "POOR"
  | "DAMAGED";

export type PreventiveMaintenanceFrequency =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY"
  | "CUSTOM";

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface FacilityAssetHistory {
  id: string;
  assetId: string;
  fromStatus?: AssetStatus;
  toStatus: AssetStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface PreventiveMaintenancePlan {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  frequency: PreventiveMaintenanceFrequency;
  intervalDays?: number;
  nextDueAt: string;
  lastCompletedAt?: string;
  assignedPersonId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiresAt?: string;
  vendorName?: string;
  vendorContact?: string;
  installedAt?: string;
  retiredAt?: string;
  disposedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  history?: FacilityAssetHistory[];
  preventivePlans?: PreventiveMaintenancePlan[];
}

export interface FacilityMetrics {
  total: number;
  active: number;
  inMaintenance: number;
  outOfService: number;
  retired: number;
  warrantyExpiring: number;
  preventiveDue: number;
}

export interface FacilityFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  categoryId?: string;
  status?: AssetStatus | "";
  condition?: AssetCondition | "";
  search?: string;
}

export interface CreateFacilityAssetInput {
  name: string;
  description?: string;
  categoryId: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  condition: AssetCondition;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiresAt?: string;
  vendorName?: string;
  vendorContact?: string;
  installedAt?: string;
  createdByPersonId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
