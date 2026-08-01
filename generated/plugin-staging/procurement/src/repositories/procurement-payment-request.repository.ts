import {
  PaymentRequestStatus,
  ProcurementPaymentRequest,
  ProcurementStatusHistory,
} from '../types/procurement.types';

export const PROCUREMENT_PAYMENT_REQUEST_REPOSITORY =
  'PROCUREMENT_PAYMENT_REQUEST_REPOSITORY';

export interface ProcurementPaymentRequestFilters {
  invoiceMatchId?: string;

  purchaseOrderId?: string;

  vendorId?: string;

  propertyId?: string;

  status?: PaymentRequestStatus;

  overdue?: boolean;

  search?: string;
}

export interface ProcurementPaymentRequestDetails
  extends ProcurementPaymentRequest {
  history: ProcurementStatusHistory[];
}

export interface ProcurementPaymentRequestRepository {
  create(
    paymentRequest: ProcurementPaymentRequest,
    history: ProcurementStatusHistory,
  ): Promise<ProcurementPaymentRequestDetails>;

  findById(
    id: string,
  ): Promise<
    ProcurementPaymentRequestDetails | null
  >;

  findActiveByInvoiceMatchId(
    invoiceMatchId: string,
  ): Promise<
    ProcurementPaymentRequest | null
  >;

  list(
    filters?: ProcurementPaymentRequestFilters,
  ): Promise<
    ProcurementPaymentRequest[]
  >;

  update(
    paymentRequest: ProcurementPaymentRequest,
  ): Promise<
    ProcurementPaymentRequestDetails
  >;

  transition(
    paymentRequest: ProcurementPaymentRequest,
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementPaymentRequestDetails
  >;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  >;

  listHistory(
    paymentRequestId: string,
  ): Promise<
    ProcurementStatusHistory[]
  >;
}
