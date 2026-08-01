import {
  CreatePurchaseRequestItemDto,
} from './create-purchase-request.dto';

import {
  ProcurementPriority,
} from '../types/procurement.types';

export class UpdatePurchaseRequestDto {
  categoryId?: string;
  zoneId?: string;
  spaceId?: string;

  title?: string;
  description?: string;
  businessJustification?: string;

  priority?: ProcurementPriority;
  requiredByDate?: string;
  currency?: string;

  updatedByPersonId!: string;

  metadata?: Record<
    string,
    unknown
  >;

  items?: CreatePurchaseRequestItemDto[];
}
