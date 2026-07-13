import {
  AssetCondition,
} from '../types/facility.types';

export class UpdateAssetDto {
  name?: string;
  description?: string;
  categoryId?: string;
  zoneId?: string;
  spaceId?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  condition?: AssetCondition;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiresAt?: string;
  vendorName?: string;
  vendorContact?: string;
  installedAt?: string;
  changedByPersonId!: string;
  remarks?: string;
}
