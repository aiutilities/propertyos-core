import {
  Vendor,
  VendorCategory,
  VendorContact,
  VendorContract,
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

  createContract(
    contract: VendorContract,
  ): Promise<VendorContract>;

  findContractById(
    id: string,
  ): Promise<VendorContract | null>;

  listContracts(
    filters?: {
      vendorId?: string;
      propertyId?: string;
      status?: string;
      search?: string;
    },
  ): Promise<VendorContract[]>;

  updateContract(
    id: string,
    input: Partial<VendorContract>,
  ): Promise<VendorContract | null>;

  listCategories():
    Promise<VendorCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<VendorCategory | null>;

  getMetrics():
    Promise<VendorMetrics>;
}
