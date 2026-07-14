export const PROCUREMENT_PERMISSIONS = {
  READ: 'procurement.read',
  CREATE: 'procurement.create',
  UPDATE: 'procurement.update',
  MANAGE: 'procurement.manage',
  APPROVE: 'procurement.approve',
  RFQ: 'procurement.rfq',
  QUOTATION: 'procurement.quotation',
  PURCHASE_ORDER: 'procurement.purchase-order',
  GOODS_RECEIPT: 'procurement.goods-receipt',
  INVOICE_MATCH: 'procurement.invoice-match',
  PAYMENT_REQUEST: 'procurement.payment-request',
  CONFIGURE: 'procurement.configure',
} as const;

export const PROCUREMENT_EVENTS = {
  PURCHASE_REQUEST_CREATED:
    'procurement.purchase_request.created',
  PURCHASE_REQUEST_UPDATED:
    'procurement.purchase_request.updated',
  PURCHASE_REQUEST_SUBMITTED:
    'procurement.purchase_request.submitted',
  PURCHASE_REQUEST_APPROVED:
    'procurement.purchase_request.approved',
  PURCHASE_REQUEST_REJECTED:
    'procurement.purchase_request.rejected',
  PURCHASE_REQUEST_CANCELLED:
    'procurement.purchase_request.cancelled',
  PURCHASE_REQUEST_CLOSED:
    'procurement.purchase_request.closed',

  RFQ_CREATED:
    'procurement.rfq.created',
  RFQ_ISSUED:
    'procurement.rfq.issued',
  RFQ_CLOSED:
    'procurement.rfq.closed',
  RFQ_AWARDED:
    'procurement.rfq.awarded',
  RFQ_CANCELLED:
    'procurement.rfq.cancelled',
  RFQ_EXPIRED:
    'procurement.rfq.expired',

  QUOTATION_CREATED:
    'procurement.quotation.created',
  QUOTATION_SUBMITTED:
    'procurement.quotation.submitted',
  QUOTATION_SELECTED:
    'procurement.quotation.selected',
  QUOTATION_REJECTED:
    'procurement.quotation.rejected',
  QUOTATION_WITHDRAWN:
    'procurement.quotation.withdrawn',
  QUOTATION_EXPIRED:
    'procurement.quotation.expired',

  COMPARISON_CREATED:
    'procurement.comparison.created',
  COMPARISON_COMPLETED:
    'procurement.comparison.completed',

  PURCHASE_ORDER_CREATED:
    'procurement.purchase_order.created',
  PURCHASE_ORDER_SUBMITTED:
    'procurement.purchase_order.submitted',
  PURCHASE_ORDER_APPROVED:
    'procurement.purchase_order.approved',
  PURCHASE_ORDER_ISSUED:
    'procurement.purchase_order.issued',
  PURCHASE_ORDER_ACKNOWLEDGED:
    'procurement.purchase_order.acknowledged',
  PURCHASE_ORDER_RECEIVED:
    'procurement.purchase_order.received',
  PURCHASE_ORDER_CLOSED:
    'procurement.purchase_order.closed',
  PURCHASE_ORDER_CANCELLED:
    'procurement.purchase_order.cancelled',

  GOODS_RECEIPT_CREATED:
    'procurement.goods_receipt.created',
  GOODS_RECEIPT_POSTED:
    'procurement.goods_receipt.posted',
  GOODS_RECEIPT_REVERSED:
    'procurement.goods_receipt.reversed',

  INVOICE_MATCH_CREATED:
    'procurement.invoice_match.created',
  INVOICE_MATCH_COMPLETED:
    'procurement.invoice_match.completed',
  INVOICE_MATCH_APPROVED:
    'procurement.invoice_match.approved',
  INVOICE_MATCH_REJECTED:
    'procurement.invoice_match.rejected',

  PAYMENT_REQUEST_CREATED:
    'procurement.payment_request.created',
  PAYMENT_REQUEST_SUBMITTED:
    'procurement.payment_request.submitted',
  PAYMENT_REQUEST_APPROVED:
    'procurement.payment_request.approved',
  PAYMENT_REQUEST_REJECTED:
    'procurement.payment_request.rejected',
  PAYMENT_REQUEST_PAID:
    'procurement.payment_request.paid',
  PAYMENT_REQUEST_CANCELLED:
    'procurement.payment_request.cancelled',
} as const;

export const PROCUREMENT_SEARCH_PROVIDER =
  'procurement';

export const PROCUREMENT_RFQ_EXPIRY_JOB_TYPE =
  'procurement.rfq.expiry';

export const PROCUREMENT_QUOTATION_EXPIRY_JOB_TYPE =
  'procurement.quotation.expiry';

export const PROCUREMENT_PO_REMINDER_JOB_TYPE =
  'procurement.purchase-order.reminder';

export const PROCUREMENT_PAYMENT_REMINDER_JOB_TYPE =
  'procurement.payment-request.reminder';
