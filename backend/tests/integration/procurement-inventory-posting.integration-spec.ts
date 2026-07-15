import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

import {
  ProcurementInventoryPostingService,
} from '../../src/core/procurement/services/procurement-inventory-posting.service';

describe(
  'ProcurementInventoryPostingService',
  () => {
    const postMovement =
      jest.fn();

    const resolveOrCreate =
      jest.fn();

    let service:
      ProcurementInventoryPostingService;

    beforeEach(
      () => {
        postMovement.mockReset();
        resolveOrCreate.mockReset();

        service =
          new ProcurementInventoryPostingService(
            {
              postMovement,
            } as any,

            {
              resolveOrCreate,
            } as any,
          );
      },
    );

    const purchaseOrder =
      {
        id:
          'purchase-order-1',

        purchaseOrderNumber:
          'PO-001',

        propertyId:
          'property-1',

        vendorId:
          'vendor-1',

        currency:
          'INR',

        items: [
          {
            id:
              'purchase-order-item-1',

            inventoryItemId:
              'inventory-item-1',

            unitPrice:
              125,
          },
        ],

        history: [],
      } as any;

    const goodsReceipt =
      {
        id:
          'goods-receipt-1',

        goodsReceiptNumber:
          'GRN-001',

        purchaseOrderId:
          'purchase-order-1',

        propertyId:
          'property-1',

        vendorId:
          'vendor-1',

        destinationStoreId:
          'store-1',

        destinationBinLocationId:
          'bin-1',

        receiptDate:
          new Date(
            '2026-07-15T00:00:00.000Z',
          ),

        items: [
          {
            id:
              'goods-receipt-item-1',

            purchaseOrderItemId:
              'purchase-order-item-1',

            receivedQuantity:
              10,

            acceptedQuantity:
              8,

            rejectedQuantity:
              2,
          },
        ],

        history: [],
      } as any;

    it(
      'posts accepted quantity using weighted-cost input',
      async () => {
        postMovement.mockResolvedValue({
          entry: {
            id:
              'ledger-entry-1',
          },

          balance: {
            quantityOnHand:
              8,
          },

          idempotentReplay:
            false,
        });

        const result =
          await service
            .postGoodsReceipt(
              goodsReceipt,
              purchaseOrder,
              'person-1',
            );

        expect(
          postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .RECEIPT,

            itemId:
              'inventory-item-1',

            storeId:
              'store-1',

            binLocationId:
              'bin-1',

            quantityDelta:
              8,

            unitCost:
              125,

            idempotencyKey:
              'procurement-grn:goods-receipt-1:goods-receipt-item-1',
          }),
        );

        expect(result).toHaveLength(1);
      },
    );

    it(
      'resolves and posts a Batch-aware Goods Receipt line',
      async () => {
        resolveOrCreate.mockResolvedValue({
          id:
            'batch-1',

          batchNumber:
            'LOT-001',

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
        });

        postMovement.mockResolvedValue({
          entry: {
            id:
              'ledger-entry-1',
          },

          balance: {
            quantityOnHand:
              8,
          },

          idempotentReplay:
            false,
        });

        await service.postGoodsReceipt(
          {
            ...goodsReceipt,

            items: [
              {
                ...goodsReceipt.items[0],

                batchNumber:
                  'LOT-001',

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
              },
            ],
          },

          purchaseOrder,
          'person-1',
        );

        expect(
          resolveOrCreate,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId:
              'inventory-item-1',

            batchNumber:
              'LOT-001',

            manufacturerBatchNumber:
              'MFG-001',

            sourceType:
              'procurement.goods_receipt',

            sourceId:
              'goods-receipt-1',

            sourceLineId:
              'goods-receipt-item-1',

            createdByPersonId:
              'person-1',
          }),
        );

        expect(
          postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            batchId:
              'batch-1',

            itemId:
              'inventory-item-1',

            quantityDelta:
              8,
          }),
        );

        const result =
          await service.postGoodsReceipt(
            {
              ...goodsReceipt,

              items: [
                {
                  ...goodsReceipt.items[0],

                  batchNumber:
                    'LOT-001',
                },
              ],
            },

            purchaseOrder,
            'person-1',
          );

        expect(result[0]).toEqual(
          expect.objectContaining({
            goodsReceiptItemId:
              'goods-receipt-item-1',

            batchId:
              'batch-1',
          }),
        );
      },
    );

    it(
      'does not resolve a Batch when Batch metadata is absent',
      async () => {
        postMovement.mockResolvedValue({
          entry: {
            id:
              'ledger-entry-1',
          },

          balance: {
            quantityOnHand:
              8,
          },

          idempotentReplay:
            false,
        });

        await service.postGoodsReceipt(
          goodsReceipt,
          purchaseOrder,
          'person-1',
        );

        expect(
          resolveOrCreate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'does not post rejected quantity',
      async () => {
        const fullyRejected =
          {
            ...goodsReceipt,

            items: [
              {
                ...goodsReceipt.items[0],

                acceptedQuantity:
                  0,

                rejectedQuantity:
                  10,
              },
            ],
          };

        const result =
          await service
            .postGoodsReceipt(
              fullyRejected,
              purchaseOrder,
              'person-1',
            );

        expect(
          postMovement,
        ).not.toHaveBeenCalled();

        expect(result).toEqual([]);
      },
    );

    it(
      'does not post unmapped Purchase Order lines',
      async () => {
        const unmapped =
          {
            ...purchaseOrder,

            items: [
              {
                ...purchaseOrder.items[0],

                inventoryItemId:
                  undefined,
              },
            ],
          };

        const result =
          await service
            .postGoodsReceipt(
              goodsReceipt,
              unmapped,
              'person-1',
            );

        expect(
          postMovement,
        ).not.toHaveBeenCalled();

        expect(result).toEqual([]);
      },
    );

    it(
      'requires destination store for mapped accepted lines',
      async () => {
        await expect(
          service.postGoodsReceipt(
            {
              ...goodsReceipt,

              destinationStoreId:
                undefined,
            },

            purchaseOrder,
            'person-1',
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'uses the same deterministic key for retries',
      async () => {
        postMovement.mockResolvedValue({
          entry: {
            id:
              'ledger-entry-1',
          },

          balance: {
            quantityOnHand:
              8,
          },

          idempotentReplay:
            true,
        });

        await service.postGoodsReceipt(
          goodsReceipt,
          purchaseOrder,
          'person-1',
        );

        await service.postGoodsReceipt(
          goodsReceipt,
          purchaseOrder,
          'person-1',
        );

        expect(
          postMovement.mock.calls[0][0]
            .idempotencyKey,
        ).toBe(
          postMovement.mock.calls[1][0]
            .idempotencyKey,
        );
      },
    );
  },
);
