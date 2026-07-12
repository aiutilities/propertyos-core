import {
  AssetCategory,
  AssetStatus,
  FacilityAsset,
  FacilityAssetDetails,
  FacilityAssetFilters,
  FacilityAssetHistory,
  PreventiveMaintenancePlan,
} from '../types/facility.types';

export const FACILITY_REPOSITORY =
  Symbol('FACILITY_REPOSITORY');

export interface FacilityRepository {
  createCategory(
    category: AssetCategory,
  ): Promise<AssetCategory>;

  listCategories(): Promise<AssetCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<AssetCategory | null>;

  createAsset(
    asset: FacilityAsset,
  ): Promise<FacilityAsset>;

  findAssetById(
    id: string,
  ): Promise<FacilityAsset | null>;

  findAssetDetailsById(
    id: string,
  ): Promise<FacilityAssetDetails | null>;

  listAssets(
    filters?: FacilityAssetFilters,
  ): Promise<FacilityAsset[]>;

  updateAsset(
    id: string,
    input: Partial<FacilityAsset>,
  ): Promise<FacilityAsset | null>;

  updateAssetStatus(
    id: string,
    status: AssetStatus,
    timestamps?: {
      retiredAt?: Date;
      disposedAt?: Date;
    },
  ): Promise<FacilityAsset | null>;

  addHistory(
    history: FacilityAssetHistory,
  ): Promise<FacilityAssetHistory>;

  listHistory(
    assetId: string,
  ): Promise<FacilityAssetHistory[]>;

  createPreventivePlan(
    plan: PreventiveMaintenancePlan,
  ): Promise<PreventiveMaintenancePlan>;

  listPreventivePlans(
    assetId: string,
  ): Promise<PreventiveMaintenancePlan[]>;

  getMetrics(propertyId?: string): Promise<{
    total: number;
    active: number;
    inMaintenance: number;
    outOfService: number;
    retired: number;
    warrantyExpiring: number;
    preventiveDue: number;
  }>;
}
