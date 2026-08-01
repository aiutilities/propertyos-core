import {
  VendorContactType,
  VendorType,
} from '../types/vendor.types';

export class VendorContactInputDto {
  contactType: VendorContactType =
    VendorContactType.PRIMARY;

  name!: string;
  designation?: string;
  email?: string;
  phone?: string;
  isPrimary = false;
}

export class VendorPropertyCoverageInputDto {
  propertyId!: string;
  zoneId?: string;
}

export class VendorServiceCategoryInputDto {
  categoryId!: string;
  notes?: string;
}

export class CreateVendorDto {
  legalName!: string;
  displayName!: string;

  vendorType: VendorType =
    VendorType.COMPANY;

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

  createdByPersonId!: string;

  contacts?: VendorContactInputDto[];
  propertyCoverage?: VendorPropertyCoverageInputDto[];
  serviceCategories?: VendorServiceCategoryInputDto[];
}
