import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryBatchService,
} from '../../src/core/inventory/services/inventory-batch.service';

import {
  InventoryBatchStatus,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Batch resolution service',
  () => {
    const findItemById =
      jest.fn();

    const findByItemAndBatchNumber =
      jest.fn();

    const create =
      jest.fn();

    let service:
      InventoryBatchService;

    beforeEach(
      () => {
        findItemById.mockReset();

        findByItemAndBatchNumber
          .mockReset();

        create.mockReset();

        service =
          new InventoryBatchService(
            {
              findByItemAndBatchNumber,
              create,
            } as any,

            {
              findItemById,
            } as any,
          );

        findItemById
          .mockResolvedValue({
            id:
              'item-1',

            isActive:
              true,

            isBatchTracked:
              true,
          });
      },
    );

    it(
      'creates a new active Batch for a batch-tracked item',
      async () => {
        findByItemAndBatchNumber
          .mockResolvedValue(
            null,
          );

        create.mockImplementation(
          async (batch) =>
            batch,
        );

        const result =
          await service
            .resolveOrCreate({
              itemId:
                'item-1',

              batchNumber:
                ' LOT-001 ',

              manufacturerBatchNumber:
                ' MFG-001 ',

              manufactureDate:
                new Date(
                  '2026-07-01T00:00:00.000Z',
                ),

              expiryDate:
                new Date(
                  '2027-07-01T00:00:00.000Z',
                ),

              sourceType:
                'procurement.goods_receipt',

              sourceId:
                'goods-receipt-1',

              sourceLineId:
                'goods-receipt-item-1',

              createdByPersonId:
                'person-1',
            });

        expect(
          create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            manufacturerBatchNumber:
              'MFG-001',

            status:
              InventoryBatchStatus
                .ACTIVE,

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
          result.batchNumber,
        ).toBe(
          'LOT-001',
        );
      },
    );

    it(
      'returns the existing compatible Batch',
      async () => {
        const existing = {
          id:
            'batch-1',

          itemId:
            'item-1',

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

          status:
            InventoryBatchStatus
              .ACTIVE,

          metadata: {},

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        };

        findByItemAndBatchNumber
          .mockResolvedValue(
            existing,
          );

        const result =
          await service
            .resolveOrCreate({
              itemId:
                'item-1',

              batchNumber:
                'LOT-001',

              manufacturerBatchNumber:
                'MFG-001',

              manufactureDate:
                new Date(
                  '2026-07-01T10:30:00.000Z',
                ),

              expiryDate:
                new Date(
                  '2027-07-01T10:30:00.000Z',
                ),
            });

        expect(result).toBe(
          existing,
        );

        expect(
          create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Inventory item',
      async () => {
        findItemById
          .mockResolvedValue(
            null,
          );

        await expect(
          service.resolveOrCreate({
            itemId:
              'missing-item',

            batchNumber:
              'LOT-001',
          }),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'rejects a non-batch-tracked item',
      async () => {
        findItemById
          .mockResolvedValue({
            id:
              'item-1',

            isActive:
              true,

            isBatchTracked:
              false,
          });

        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects an empty Batch number',
      async () => {
        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              '   ',
          }),
        ).rejects.toThrow(
          'Inventory Batch number is required',
        );
      },
    );

    it(
      'rejects expiry before manufacture date',
      async () => {
        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            manufactureDate:
              new Date(
                '2027-07-01T00:00:00.000Z',
              ),

            expiryDate:
              new Date(
                '2026-07-01T00:00:00.000Z',
              ),
          }),
        ).rejects.toThrow(
          'Inventory Batch expiry date cannot be before manufacture date',
        );
      },
    );

    it(
      'rejects a held existing Batch',
      async () => {
        findByItemAndBatchNumber
          .mockResolvedValue({
            id:
              'batch-1',

            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            status:
              InventoryBatchStatus
                .HOLD,

            metadata: {},

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          });

        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',
          }),
        ).rejects.toThrow(
          'Inventory Batch is not active: HOLD',
        );
      },
    );

    it(
      'rejects conflicting metadata for an existing Batch',
      async () => {
        findByItemAndBatchNumber
          .mockResolvedValue({
            id:
              'batch-1',

            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            manufacturerBatchNumber:
              'ORIGINAL-MFG',

            status:
              InventoryBatchStatus
                .ACTIVE,

            metadata: {},

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          });

        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            manufacturerBatchNumber:
              'DIFFERENT-MFG',
          }),
        ).rejects.toThrow(
          'Inventory Batch manufacturer Batch number conflicts with the existing Batch',
        );
      },
    );

    it(
      'validates a Batch returned after a concurrent create',
      async () => {
        findByItemAndBatchNumber
          .mockResolvedValue(
            null,
          );

        create.mockResolvedValue({
          id:
            'batch-1',

          itemId:
            'item-1',

          batchNumber:
            'LOT-001',

          manufacturerBatchNumber:
            'OTHER-MFG',

          status:
            InventoryBatchStatus
              .ACTIVE,

          metadata: {},

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        });

        await expect(
          service.resolveOrCreate({
            itemId:
              'item-1',

            batchNumber:
              'LOT-001',

            manufacturerBatchNumber:
              'EXPECTED-MFG',
          }),
        ).rejects.toThrow(
          'Inventory Batch manufacturer Batch number conflicts with the existing Batch',
        );
      },
    );
  },
);
