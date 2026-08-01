import {
  VendorType,
} from '../types/vendor.types';

import {
  VendorContactInputDto,
  VendorPropertyCoverageInputDto,
  VendorServiceCategoryInputDto,
} from './create-vendor.dto';

export class UpdateVendorDto {
  legalName?: string;
  displayName?: string;
  vendorType?: VendorType;

  email?: string;
  phone?: string;
  website?: string;

  taxIdentifier?: string;
  panNumber?: string;
  registrationNumber?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;

  notes?: string;
  metadata?: Record<string, unknown>;

  updatedByPersonId!: string;

  contacts?: VendorContactInputDto[];
  propertyCoverage?: VendorPropertyCoverageInputDto[];
  serviceCategories?: VendorServiceCategoryInputDto[];
}
