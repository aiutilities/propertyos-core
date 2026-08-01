import {
  ProcurementQuotation,
  ProcurementQuotationItem,
  ProcurementStatusHistory,
  QuotationStatus,
} from '../types/procurement.types';

export const PROCUREMENT_QUOTATION_REPOSITORY =
  'PROCUREMENT_QUOTATION_REPOSITORY';

export interface ProcurementQuotationFilters {
  rfqId?: string;
  vendorId?: string;
  propertyId?: string;
  status?: QuotationStatus;
  search?: string;
}

export interface ProcurementQuotationDetails
  extends ProcurementQuotation {
  items: ProcurementQuotationItem[];
  history: ProcurementStatusHistory[];
}

export interface ProcurementQuotationRepository {
  create(
    quotation: ProcurementQuotation,
    items: ProcurementQuotationItem[],
  ): Promise<ProcurementQuotationDetails>;

  findById(
    id: string,
  ): Promise<
    ProcurementQuotationDetails | null
  >;

  findByRfqAndVendor(
    rfqId: string,
    vendorId: string,
  ): Promise<
    ProcurementQuotation | null
  >;

  list(
    filters?: ProcurementQuotationFilters,
  ): Promise<ProcurementQuotation[]>;

  update(
    quotation: ProcurementQuotation,
    items?: ProcurementQuotationItem[],
  ): Promise<ProcurementQuotationDetails>;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;

  listRfqItemIds(
    rfqId: string,
  ): Promise<string[]>;

  isVendorInvited(
    rfqId: string,
    vendorId: string,
  ): Promise<boolean>;
}
