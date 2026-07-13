import {
  VendorWorkOrderPriority,
} from '../types/vendor.types';

export class CreateVendorWorkOrderDto {
  vendorId!: string;
  propertyId!: string;

  zoneId?: string;
  spaceId?: string;
  contractId?: string;

  maintenanceTicketId?: string;
  helpdeskTicketId?: string;
  facilityAssetId?: string;

  title!: string;
  description!: string;

  priority:
    VendorWorkOrderPriority =
      VendorWorkOrderPriority.MEDIUM;

  scheduledStartAt?: string;
  scheduledEndAt?: string;

  estimatedCost?: number;
  currency = 'INR';

  assignedByPersonId!: string;
}
