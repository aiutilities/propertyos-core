import {
  ProcurementRfq,
  ProcurementRfqItem,
  ProcurementRfqVendor,
  RfqStatus,
} from '../types/procurement.types';

import {
  ProcurementStatusHistory,
} from '../types/procurement.types';

export const PROCUREMENT_RFQ_REPOSITORY =
  'PROCUREMENT_RFQ_REPOSITORY';

export interface ProcurementRfqFilters {
  purchaseRequestId?: string;
  propertyId?: string;
  vendorId?: string;
  status?: RfqStatus;
  search?: string;
}

export interface ProcurementRfqDetails
  extends ProcurementRfq {
  items: ProcurementRfqItem[];
  vendors: ProcurementRfqVendor[];
  history: ProcurementStatusHistory[];
}

export interface ProcurementRfqRepository {
  create(
    rfq: ProcurementRfq,
    items: ProcurementRfqItem[],
    vendors: ProcurementRfqVendor[],
  ): Promise<ProcurementRfqDetails>;

  findById(
    id: string,
  ): Promise<
    ProcurementRfqDetails | null
  >;

  findByPurchaseRequestId(
    purchaseRequestId: string,
  ): Promise<
    ProcurementRfq | null
  >;

  findActiveVendorIds(
    vendorIds: string[],
  ): Promise<string[]>;

  list(
    filters?: ProcurementRfqFilters,
  ): Promise<ProcurementRfq[]>;

  update(
    rfq: ProcurementRfq,
    items?: ProcurementRfqItem[],
    vendors?: ProcurementRfqVendor[],
  ): Promise<ProcurementRfqDetails>;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;

  markVendorViewed(
    rfqId: string,
    vendorId: string,
    viewedAt: Date,
  ): Promise<ProcurementRfqVendor | null>;

  markVendorResponded(
    rfqId: string,
    vendorId: string,
    respondedAt: Date,
  ): Promise<ProcurementRfqVendor | null>;

  markVendorDeclined(
    rfqId: string,
    vendorId: string,
    declinedAt: Date,
    declineReason: string,
  ): Promise<ProcurementRfqVendor | null>;
}
