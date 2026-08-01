import {
  ProcurementStatusHistory,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '../types/procurement.types';

export const PROCUREMENT_PURCHASE_ORDER_REPOSITORY =
  'PROCUREMENT_PURCHASE_ORDER_REPOSITORY';

export interface PurchaseOrderFilters {
  quotationId?: string;

  rfqId?: string;

  purchaseRequestId?: string;

  propertyId?: string;

  vendorId?: string;

  status?: PurchaseOrderStatus;

  search?: string;
}

export interface PurchaseOrderDetails
  extends PurchaseOrder {
  items: PurchaseOrderItem[];

  history: ProcurementStatusHistory[];
}

export interface PurchaseOrderRepository {
  create(
    purchaseOrder: PurchaseOrder,
    items: PurchaseOrderItem[],
  ): Promise<PurchaseOrderDetails>;

  findById(
    id: string,
  ): Promise<
    PurchaseOrderDetails | null
  >;

  findByQuotationId(
    quotationId: string,
  ): Promise<
    PurchaseOrder | null
  >;

  list(
    filters?: PurchaseOrderFilters,
  ): Promise<PurchaseOrder[]>;

  update(
    purchaseOrder: PurchaseOrder,
    items?: PurchaseOrderItem[],
  ): Promise<PurchaseOrderDetails>;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;
}
