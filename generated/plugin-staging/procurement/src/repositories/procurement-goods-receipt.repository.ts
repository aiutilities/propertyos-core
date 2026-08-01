import {
  GoodsReceipt,
  GoodsReceiptItem,
  GoodsReceiptStatus,
  ProcurementStatusHistory,
  PurchaseOrderStatus,
} from '../types/procurement.types';

export const PROCUREMENT_GOODS_RECEIPT_REPOSITORY =
  'PROCUREMENT_GOODS_RECEIPT_REPOSITORY';

export interface GoodsReceiptFilters {
  purchaseOrderId?: string;

  propertyId?: string;

  vendorId?: string;

  status?: GoodsReceiptStatus;

  search?: string;
}

export interface GoodsReceiptDetails extends GoodsReceipt {
  items: GoodsReceiptItem[];

  history: ProcurementStatusHistory[];
}

export interface PostedReceiptQuantity {
  purchaseOrderItemId: string;

  postedReceivedQuantity: number;
}

export interface GoodsReceiptPostingItem {
  goodsReceiptItemId: string;

  purchaseOrderItemId: string;

  receivedQuantity: number;

  newCumulativeReceivedQuantity: number;

  batchId?: string;
}

export interface GoodsReceiptPostingResult {
  goodsReceipt: GoodsReceiptDetails;

  purchaseOrderStatus: PurchaseOrderStatus;
}

export interface GoodsReceiptReversalItem {
  goodsReceiptItemId: string;

  purchaseOrderItemId: string;

  receivedQuantity: number;

  restoredCumulativeReceivedQuantity: number;
}

export interface GoodsReceiptReversalResult {
  goodsReceipt: GoodsReceiptDetails;

  purchaseOrderStatus: PurchaseOrderStatus;
}

export interface GoodsReceiptRepository {
  create(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptItem[],
    history: ProcurementStatusHistory,
  ): Promise<GoodsReceiptDetails>;

  findById(
    id: string,
  ): Promise<GoodsReceiptDetails | null>;

  list(
    filters?: GoodsReceiptFilters,
  ): Promise<GoodsReceipt[]>;

  update(
    goodsReceipt: GoodsReceipt,
    items?: GoodsReceiptItem[],
  ): Promise<GoodsReceiptDetails>;

  addHistory(
    history: ProcurementStatusHistory,
  ): Promise<ProcurementStatusHistory>;

  listItems(
    goodsReceiptId: string,
  ): Promise<GoodsReceiptItem[]>;

  listHistory(
    goodsReceiptId: string,
  ): Promise<ProcurementStatusHistory[]>;

  aggregatePostedQuantities(
    purchaseOrderId: string,
  ): Promise<PostedReceiptQuantity[]>;

  post(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptPostingItem[],
    purchaseOrderStatus: PurchaseOrderStatus,
    history: ProcurementStatusHistory,
    purchaseOrderHistory: ProcurementStatusHistory,
  ): Promise<GoodsReceiptPostingResult>;

  reverse(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptReversalItem[],
    purchaseOrderStatus: PurchaseOrderStatus,
    history: ProcurementStatusHistory,
    purchaseOrderHistory: ProcurementStatusHistory,
  ): Promise<GoodsReceiptReversalResult>;
}
