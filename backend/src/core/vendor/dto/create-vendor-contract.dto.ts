import {
  VendorContractType,
} from '../types/vendor.types';

export class CreateVendorContractDto {
  vendorId!: string;
  propertyId?: string;

  contractType!: VendorContractType;

  title!: string;
  description?: string;

  startDate!: string;
  endDate!: string;

  contractValue?: number;
  currency = 'INR';

  responseSlaMinutes?: number;
  resolutionSlaMinutes?: number;

  autoRenew = false;
  renewalNoticeDays = 30;

  createdByPersonId!: string;
}
