import {
  InvoiceMatchStatus,
  ProcurementInvoiceMatch,
  ProcurementInvoiceMatchItem,
  ProcurementStatusHistory,
} from '../types/procurement.types';

export const PROCUREMENT_INVOICE_MATCH_REPOSITORY =
  'PROCUREMENT_INVOICE_MATCH_REPOSITORY';

export interface ProcurementInvoiceMatchFilters {
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  vendorId?: string;
  propertyId?: string;
  status?: InvoiceMatchStatus;
  search?: string;
}

export interface ProcurementInvoiceMatchDetails
  extends ProcurementInvoiceMatch {
  items: ProcurementInvoiceMatchItem[];
  history: ProcurementStatusHistory[];
}

export interface ProcurementInvoiceMatchRepository {
  create(
    invoiceMatch: ProcurementInvoiceMatch,
    items: ProcurementInvoiceMatchItem[],
    history: ProcurementStatusHistory,
  ): Promise<ProcurementInvoiceMatchDetails>;

  findById(
    id: string,
  ): Promise<
    ProcurementInvoiceMatchDetails | null
  >;

  list(
    filters?: ProcurementInvoiceMatchFilters,
  ): Promise<
    ProcurementInvoiceMatch[]
  >;

  update(
    invoiceMatch: ProcurementInvoiceMatch,
    items?: ProcurementInvoiceMatchItem[],
  ): Promise<
    ProcurementInvoiceMatchDetails
  >;

  transition(
    invoiceMatch: ProcurementInvoiceMatch,
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementInvoiceMatchDetails
  >;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;

  listItems(
    invoiceMatchId: string,
  ): Promise<
    ProcurementInvoiceMatchItem[]
  >;

  listHistory(
    invoiceMatchId: string,
  ): Promise<
    ProcurementStatusHistory[]
  >;
}
