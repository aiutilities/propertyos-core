import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
} from '@nestjs/common';

import {
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

import {
  ProcurementItemType,
} from '../types/procurement.types';

import {
  ProcurementInventoryPostingService,
} from './procurement-inventory-posting.service';

describe(
  'ProcurementInventoryPostingService Goods Receipt FAT contract',
  () => {
    let stockLedgerRepository:
      jest.Mocked<
        Pick<
          InventoryStockLedgerRepository,
          'postMovement'
        >
      >;

    let batchService:
      jest.Mocked<
        Pick<
          InventoryBatchService,
          'resolveOrCreate'
        >
      >;

    let service:
      ProcurementInventoryPostingService;

    const now =
      new Date(
        '2026-07-28T00:00:00.000Z',
      );

    const movementResult =
      {
        entry: {
          id:
            'ledger-entry-1',
        },
        balance: {
          id:
            'balance-1',
        },
        idempotentReplay:
          false,
      } as unknown as
        PostInventoryMovementResult;

    const createPurchaseOrder = (
      inventoryItemId:
        string | undefined =
          'inventory-item-1',
    ): PurchaseOrderDetails =>
      ({
        id:
          'purchase-order-1',
        purchaseOrderNumber:
          'PO-20260728-001',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        title:
          'Inventory purchase',
        orderDate:
          now,
        subtotal:
          5000,
        discountAmount:
          0,
        taxAmount:
          900,
        freightAmount:
          0,
        totalAmount:
          5900,
        currency:
          'INR',
        createdByPersonId:
          'person-1',
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'purchase-order-item-1',
            purchaseOrderId:
              'purchase-order-1',
            lineNumber:
              1,
            itemType:
              ProcurementItemType.GOODS,
            inventoryItemId,
            description:
              'Modular switch',
            orderedQuantity:
              10,
            receivedQuantity:
              0,
            unit:
              'EA',
            unitPrice:
              500,
            discountAmount:
              0,
            taxRate:
              18,
            taxAmount:
              900,
            lineTotal:
              5900,
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as PurchaseOrderDetails);

    const createGoodsReceipt = (
      input: {
        destinationStoreId?:
          string;
        destinationBinLocationId?:
          string;
        acceptedQuantity?:
          number;
        batchNumber?:
          string;
      } = {},
    ): GoodsReceiptDetails =>
      ({
        id:
          'goods-receipt-1',
        goodsReceiptNumber:
          'GRN-20260728-001',
        purchaseOrderId:
          'purchase-order-1',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        receiptDate:
          now,
        destinationStoreId:
          input.destinationStoreId,
        destinationBinLocationId:
          input.destinationBinLocationId,
        receivedByPersonId:
          'person-2',
        remarks:
          'Founder acceptance receipt',
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'goods-receipt-item-1',
            goodsReceiptId:
              'goods-receipt-1',
            purchaseOrderItemId:
              'purchase-order-item-1',
            orderedQuantity:
              10,
            previouslyReceivedQuantity:
              0,
            receivedQuantity:
              input.acceptedQuantity ??
              5,
            acceptedQuantity:
              input.acceptedQuantity ??
              5,
            rejectedQuantity:
              0,
            batchNumber:
              input.batchNumber,
            remarks:
              'Accepted stock',
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as GoodsReceiptDetails);

    beforeEach(() => {
      stockLedgerRepository = {
        postMovement:
          jest.fn(),
      };

      batchService = {
        resolveOrCreate:
          jest.fn(),
      };

      stockLedgerRepository
        .postMovement
        .mockResolvedValue(
          movementResult,
        );

      service =
        new ProcurementInventoryPostingService(
          stockLedgerRepository as unknown as
            InventoryStockLedgerRepository,
          batchService as unknown as
            InventoryBatchService,
        );
    });

    it(
      'posts an accepted Goods Receipt line as an Inventory receipt movement',
      async () => {
        const receipt =
          createGoodsReceipt({
            destinationStoreId:
              'store-1',
            destinationBinLocationId:
              'bin-1',
          });

        const purchaseOrder =
          createPurchaseOrder();

        const result =
          await service
            .postGoodsReceipt(
              receipt,
              purchaseOrder,
              'founder-person-1',
            );

        expect(result).toEqual([
          {
            goodsReceiptItemId:
              'goods-receipt-item-1',
            purchaseOrderItemId:
              'purchase-order-item-1',
            inventoryItemId:
              'inventory-item-1',
            batchId:
              undefined,
            movement:
              movementResult,
          },
        ]);

        expect(
          batchService.resolveOrCreate,
        ).not.toHaveBeenCalled();

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType
              .RECEIPT,
          itemId:
            'inventory-item-1',
          storeId:
            'store-1',
          binLocationId:
            'bin-1',
          batchId:
            undefined,
          quantityDelta:
            5,
          unitCost:
            500,
          sourceType:
            'procurement.goods_receipt',
          sourceId:
            'goods-receipt-1',
          sourceLineId:
            'goods-receipt-item-1',
          referenceNumber:
            'GRN-20260728-001',
          idempotencyKey:
            'procurement-grn:goods-receipt-1:goods-receipt-item-1',
          correlationId:
            'goods-receipt-1',
          movementDate:
            now,
          postedByPersonId:
            'founder-person-1',
          remarks:
            'Accepted stock',
          metadata: {
            propertyId:
              'property-1',
            vendorId:
              'vendor-1',
            purchaseOrderId:
              'purchase-order-1',
            purchaseOrderNumber:
              'PO-20260728-001',
            purchaseOrderItemId:
              'purchase-order-item-1',
            goodsReceiptId:
              'goods-receipt-1',
            goodsReceiptNumber:
              'GRN-20260728-001',
            goodsReceiptItemId:
              'goods-receipt-item-1',
            receivedQuantity:
              5,
            acceptedQuantity:
              5,
            rejectedQuantity:
              0,
            unitPrice:
              500,
            currency:
              'INR',
            batchId:
              undefined,
            batchNumber:
              undefined,
            manufacturerBatchNumber:
              undefined,
            manufactureDate:
              undefined,
            expiryDate:
              undefined,
          },
        });
      },
    );

    it(
      'resolves Batch metadata before posting a Batch-linked receipt',
      async () => {
        const batch = {
          id:
            'batch-1',
          itemId:
            'inventory-item-1',
          batchNumber:
            'BATCH-001',
          manufacturerBatchNumber:
            'MFG-001',
          manufactureDate:
            new Date(
              '2026-07-01T00:00:00.000Z',
            ),
          expiryDate:
            new Date(
              '2027-07-01T00:00:00.000Z',
            ),
        };

        batchService
          .resolveOrCreate
          .mockResolvedValue(
            batch as Awaited<
              ReturnType<
                InventoryBatchService[
                  'resolveOrCreate'
                ]
              >
            >,
          );

        const receipt =
          createGoodsReceipt({
            destinationStoreId:
              'store-1',
            destinationBinLocationId:
              'bin-1',
            batchNumber:
              'BATCH-001',
          });

        receipt.items[0]
          .manufacturerBatchNumber =
            'MFG-001';

        receipt.items[0]
          .manufactureDate =
            batch.manufactureDate;

        receipt.items[0]
          .expiryDate =
            batch.expiryDate;

        const result =
          await service
            .postGoodsReceipt(
              receipt,
              createPurchaseOrder(),
              'founder-person-1',
            );

        expect(
          batchService.resolveOrCreate,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId:
              'inventory-item-1',
            batchNumber:
              'BATCH-001',
            manufacturerBatchNumber:
              'MFG-001',
            sourceType:
              'procurement.goods_receipt',
            sourceId:
              'goods-receipt-1',
            sourceLineId:
              'goods-receipt-item-1',
            createdByPersonId:
              'founder-person-1',
          }),
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            batchId:
              'batch-1',
            quantityDelta:
              5,
          }),
        );

        expect(result[0]).toEqual(
          expect.objectContaining({
            batchId:
              'batch-1',
          }),
        );
      },
    );

    it(
      'returns no posting for a Purchase Order line without an Inventory mapping',
      async () => {
        await expect(
          service.postGoodsReceipt(
            createGoodsReceipt(),
            createPurchaseOrder(
              '',
            ),
            'founder-person-1',
          ),
        ).resolves.toEqual([]);

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();

        expect(
          batchService.resolveOrCreate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns no posting for a zero-accepted-quantity line',
      async () => {
        await expect(
          service.postGoodsReceipt(
            createGoodsReceipt({
              acceptedQuantity:
                0,
            }),
            createPurchaseOrder(),
            'founder-person-1',
          ),
        ).resolves.toEqual([]);

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'requires a destination store when an accepted line maps to Inventory',
      async () => {
        await expect(
          service.postGoodsReceipt(
            createGoodsReceipt(),
            createPurchaseOrder(),
            'founder-person-1',
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();

        expect(
          batchService.resolveOrCreate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a Goods Receipt item that does not belong to the Purchase Order',
      async () => {
        const receipt =
          createGoodsReceipt({
            destinationStoreId:
              'store-1',
          });

        receipt.items[0]
          .purchaseOrderItemId =
            'foreign-purchase-order-item';

        await expect(
          service.postGoodsReceipt(
            receipt,
            createPurchaseOrder(),
            'founder-person-1',
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
