import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
  PostInventoryMovementResult,
} from '../../inventory/repositories/inventory-stock-ledger.repository';

import {
  InventoryStockMovementType,
} from '../../inventory/types/inventory.types';

import {
  GoodsReceiptDetails,
} from '../repositories/procurement-goods-receipt.repository';

import {
  PurchaseOrderDetails,
} from '../repositories/procurement-purchase-order.repository';

export interface ProcurementInventoryPostingResult {
  goodsReceiptItemId: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  movement:
    PostInventoryMovementResult;
}

@Injectable()
export class ProcurementInventoryPostingService {
  constructor(
    @Inject(
      INVENTORY_STOCK_LEDGER_REPOSITORY,
    )
    private readonly stockLedgerRepository:
      InventoryStockLedgerRepository,
  ) {}

  async postGoodsReceipt(
    goodsReceipt:
      GoodsReceiptDetails,

    purchaseOrder:
      PurchaseOrderDetails,

    postedByPersonId: string,
  ): Promise<
    ProcurementInventoryPostingResult[]
  > {
    const purchaseOrderItemMap =
      new Map(
        purchaseOrder.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const mappedLines =
      goodsReceipt.items
        .map(
          (goodsReceiptItem) => {
            const purchaseOrderItem =
              purchaseOrderItemMap.get(
                goodsReceiptItem
                  .purchaseOrderItemId,
              );

            if (!purchaseOrderItem) {
              throw new BadRequestException(
                `Purchase Order item does not belong to this Purchase Order: ${goodsReceiptItem.purchaseOrderItemId}`,
              );
            }

            return {
              goodsReceiptItem,
              purchaseOrderItem,
            };
          },
        )
        .filter(
          ({
            goodsReceiptItem,
            purchaseOrderItem,
          }) =>
            Boolean(
              purchaseOrderItem
                .inventoryItemId,
            ) &&
            goodsReceiptItem
              .acceptedQuantity > 0,
        );

    if (
      mappedLines.length === 0
    ) {
      return [];
    }

    if (
      !goodsReceipt
        .destinationStoreId
    ) {
      throw new BadRequestException(
        'Destination Inventory store is required for Inventory-mapped Goods Receipt items',
      );
    }

    const results:
      ProcurementInventoryPostingResult[] =
      [];

    for (
      const {
        goodsReceiptItem,
        purchaseOrderItem,
      }
      of mappedLines
    ) {
      const inventoryItemId =
        purchaseOrderItem
          .inventoryItemId;

      if (!inventoryItemId) {
        continue;
      }

      const movement =
        await this
          .stockLedgerRepository
          .postMovement({
            movementType:
              InventoryStockMovementType
                .RECEIPT,

            itemId:
              inventoryItemId,

            storeId:
              goodsReceipt
                .destinationStoreId,

            binLocationId:
              goodsReceipt
                .destinationBinLocationId,

            quantityDelta:
              goodsReceiptItem
                .acceptedQuantity,

            unitCost:
              purchaseOrderItem
                .unitPrice,

            sourceType:
              'procurement.goods_receipt',

            sourceId:
              goodsReceipt.id,

            sourceLineId:
              goodsReceiptItem.id,

            referenceNumber:
              goodsReceipt
                .goodsReceiptNumber,

            idempotencyKey:
              [
                'procurement-grn',
                goodsReceipt.id,
                goodsReceiptItem.id,
              ].join(':'),

            correlationId:
              goodsReceipt.id,

            movementDate:
              goodsReceipt
                .receiptDate,

            postedByPersonId,

            remarks:
              goodsReceiptItem
                .remarks ??
              goodsReceipt.remarks,

            metadata: {
              propertyId:
                goodsReceipt.propertyId,

              vendorId:
                goodsReceipt.vendorId,

              purchaseOrderId:
                purchaseOrder.id,

              purchaseOrderNumber:
                purchaseOrder
                  .purchaseOrderNumber,

              purchaseOrderItemId:
                purchaseOrderItem.id,

              goodsReceiptId:
                goodsReceipt.id,

              goodsReceiptNumber:
                goodsReceipt
                  .goodsReceiptNumber,

              goodsReceiptItemId:
                goodsReceiptItem.id,

              receivedQuantity:
                goodsReceiptItem
                  .receivedQuantity,

              acceptedQuantity:
                goodsReceiptItem
                  .acceptedQuantity,

              rejectedQuantity:
                goodsReceiptItem
                  .rejectedQuantity,

              unitPrice:
                purchaseOrderItem
                  .unitPrice,

              currency:
                purchaseOrder.currency,
            },
          });

      results.push({
        goodsReceiptItemId:
          goodsReceiptItem.id,

        purchaseOrderItemId:
          purchaseOrderItem.id,

        inventoryItemId,

        movement,
      });
    }

    return results;
  }
}
