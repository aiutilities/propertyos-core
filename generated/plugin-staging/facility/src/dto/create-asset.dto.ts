import {
  AssetCondition,
  AssetStatus,
} from '../types/facility.types';

export class CreateAssetDto {
  name!: string;
  description?: string;
  categoryId!: string;
  propertyId!: string;
  zoneId?: string;
  spaceId?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus = AssetStatus.DRAFT;
  condition: AssetCondition = AssetCondition.GOOD;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiresAt?: string;
  vendorName?: string;
  vendorContact?: string;
  installedAt?: string;
  createdByPersonId!: string;
}
