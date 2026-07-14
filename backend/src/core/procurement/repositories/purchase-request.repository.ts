import {
  ProcurementCategory,
  ProcurementMetrics,
  ProcurementStatusHistory,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestStatus,
} from '../types/procurement.types';

export const PURCHASE_REQUEST_REPOSITORY =
  'PURCHASE_REQUEST_REPOSITORY';

export interface PurchaseRequestFilters {
  propertyId?: string;
  categoryId?: string;
  requestedByPersonId?: string;
  status?: PurchaseRequestStatus;
  search?: string;
}

export interface PurchaseRequestDetails
  extends PurchaseRequest {
  items: PurchaseRequestItem[];
  category?: ProcurementCategory;
  history: ProcurementStatusHistory[];
}

export interface PurchaseRequestRepository {
  create(
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
  ): Promise<PurchaseRequestDetails>;

  findById(
    id: string,
  ): Promise<
    PurchaseRequestDetails | null
  >;

  list(
    filters?: PurchaseRequestFilters,
  ): Promise<PurchaseRequest[]>;

  update(
    request: PurchaseRequest,
    items?: PurchaseRequestItem[],
  ): Promise<PurchaseRequestDetails>;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;

  listCategories(): Promise<
    ProcurementCategory[]
  >;

  getMetrics(): Promise<
    ProcurementMetrics
  >;
}
