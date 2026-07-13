import {
  Vendor,
  VendorCategory,
  VendorContact,
  VendorDetails,
  VendorFilters,
  VendorMetrics,
  VendorPropertyCoverage,
  VendorServiceCategory,
} from '../types/vendor.types';

export const VENDOR_REPOSITORY =
  Symbol('VENDOR_REPOSITORY');

export interface VendorRepository {
  create(
    vendor: Vendor,
  ): Promise<Vendor>;

  findById(
    id: string,
  ): Promise<Vendor | null>;

  findDetailsById(
    id: string,
  ): Promise<VendorDetails | null>;

  findAll(
    filters?: VendorFilters,
  ): Promise<Vendor[]>;

  update(
    id: string,
    input: Partial<Vendor>,
  ): Promise<Vendor | null>;

  replaceContacts(
    vendorId: string,
    contacts: VendorContact[],
  ): Promise<VendorContact[]>;

  listContacts(
    vendorId: string,
  ): Promise<VendorContact[]>;

  replacePropertyCoverage(
    vendorId: string,
    coverage: VendorPropertyCoverage[],
  ): Promise<VendorPropertyCoverage[]>;

  listPropertyCoverage(
    vendorId: string,
  ): Promise<VendorPropertyCoverage[]>;

  replaceServiceCategories(
    vendorId: string,
    categories: VendorServiceCategory[],
  ): Promise<VendorServiceCategory[]>;

  listServiceCategories(
    vendorId: string,
  ): Promise<VendorServiceCategory[]>;

  listCategories():
    Promise<VendorCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<VendorCategory | null>;

  getMetrics():
    Promise<VendorMetrics>;
}
