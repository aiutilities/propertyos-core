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
  InventoryBatchService,
} from '../../inventory/services/inventory-batch.service';


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
  batchId?: string;

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

    private readonly batchService:
      InventoryBatchService,
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

      const batch =
        goodsReceiptItem.batchNumber
          ? await this.batchService
              .resolveOrCreate({
                itemId:
                  inventoryItemId,

                batchNumber:
                  goodsReceiptItem
                    .batchNumber,

                manufacturerBatchNumber:
                  goodsReceiptItem
                    .manufacturerBatchNumber,

                manufactureDate:
                  goodsReceiptItem
                    .manufactureDate,

                expiryDate:
                  goodsReceiptItem
                    .expiryDate,

                sourceType:
                  'procurement.goods_receipt',

                sourceId:
                  goodsReceipt.id,

                sourceLineId:
                  goodsReceiptItem.id,

                remarks:
                  goodsReceiptItem
                    .remarks,

                metadata: {
                  propertyId:
                    goodsReceipt.propertyId,

                  vendorId:
                    goodsReceipt.vendorId,

                  purchaseOrderId:
                    purchaseOrder.id,

                  purchaseOrderItemId:
                    purchaseOrderItem.id,

                  goodsReceiptNumber:
                    goodsReceipt
                      .goodsReceiptNumber,
                },

                createdByPersonId:
                  postedByPersonId,
              })
          : undefined;

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

            batchId:
              batch?.id,

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

              batchId:
                batch?.id,

              batchNumber:
                batch?.batchNumber,

              manufacturerBatchNumber:
                batch
                  ?.manufacturerBatchNumber,

              manufactureDate:
                batch
                  ?.manufactureDate
                  ?.toISOString()
                  .slice(
                    0,
                    10,
                  ),

              expiryDate:
                batch
                  ?.expiryDate
                  ?.toISOString()
                  .slice(
                    0,
                    10,
                  ),
            },
          });

      results.push({
        goodsReceiptItemId:
          goodsReceiptItem.id,

        purchaseOrderItemId:
          purchaseOrderItem.id,

        inventoryItemId,

        batchId:
          batch?.id,

        movement,
      });
    }

    return results;
  }
}
