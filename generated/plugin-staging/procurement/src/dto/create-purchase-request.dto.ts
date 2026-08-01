import {
  ProcurementItemType,
  ProcurementPriority,
} from '../types/procurement.types';

export class CreatePurchaseRequestItemDto {
  itemType!: ProcurementItemType;
  itemCode?: string;
  description!: string;
  quantity!: number;
  unit!: string;
  estimatedUnitPrice?: number;
  specifications?: string;
  preferredVendorId?: string;
}

export class CreatePurchaseRequestDto {
  propertyId!: string;
  zoneId?: string;
  spaceId?: string;
  categoryId!: string;
  requestedByPersonId!: string;

  title!: string;
  description?: string;
  businessJustification?: string;

  priority: ProcurementPriority =
    ProcurementPriority.MEDIUM;

  requiredByDate?: string;
  currency = 'INR';

  metadata?: Record<
    string,
    unknown
  >;

  items!: CreatePurchaseRequestItemDto[];
}
