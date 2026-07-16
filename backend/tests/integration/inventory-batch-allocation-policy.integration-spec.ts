import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryBatchAllocationService,
} from '../../src/core/inventory/services/inventory-batch-allocation.service';

import {
  InventoryBatchAllocationStrategy,
  InventoryBatchStatus,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Batch Allocation policies',
  () => {
    const itemId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const otherStoreId =
      '99999999-9999-4999-8999-999999999999';

    const binLocationId =
      '33333333-3333-4333-8333-333333333333';

    const firstBatchId =
      '44444444-4444-4444-8444-444444444444';

    let allocationRepository:
      any;

    let inventoryRepository:
      any;

    let service:
      InventoryBatchAllocationService;

    beforeEach(
      () => {
        allocationRepository = {
          findAvailableBatches:
            jest.fn()
              .mockResolvedValue([
                {
                  batchId:
                    firstBatchId,

                  itemId,
                  storeId,
                  binLocationId,

                  batchNumber:
                    'BATCH-A',

                  batchStatus:
                    InventoryBatchStatus
                      .ACTIVE,

                  quantityOnHand:
                    5,

                  reservedQuantity:
                    1,

                  availableQuantity:
                    4,

                  averageUnitCost:
                    10,

                  batchCreatedAt:
                    new Date(
                      '2026-01-01T00:00:00.000Z',
                    ),
                },
              ]),
        };

        inventoryRepository = {
          findItemById:
            jest.fn()
              .mockResolvedValue({
                id:
                  itemId,

                isActive:
                  true,

                isBatchTracked:
                  true,
              }),

          findStoreById:
            jest.fn()
              .mockResolvedValue({
                id:
                  storeId,

                isActive:
                  true,
              }),

          findBinLocationById:
            jest.fn()
              .mockResolvedValue({
                id:
                  binLocationId,

                storeId,

                isActive:
                  true,
              }),
        };

        service =
          new InventoryBatchAllocationService(
            allocationRepository,
            inventoryRepository,
          );
      },
    );

    it(
      'returns a partial preview by default',
      async () => {
        const result =
          await service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              7,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          });

        expect(
          result.allocatedQuantity,
        ).toBe(4);

        expect(
          result.shortageQuantity,
        ).toBe(3);

        expect(
          result.fullyAllocated,
        ).toBe(false);
      },
    );

    it(
      'rejects shortages in strict mode',
      async () => {
        await expect(
          service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              7,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,

            strict:
              true,
          }),
        ).rejects.toThrow(
          'Inventory Batch allocation could not satisfy the requested quantity',
        );
      },
    );

    it(
      'allows strict allocation when fully satisfied',
      async () => {
        const result =
          await service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              4,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,

            strict:
              true,
          });

        expect(
          result.fullyAllocated,
        ).toBe(true);
      },
    );

    it(
      'rejects an unknown Inventory store',
      async () => {
        inventoryRepository
          .findStoreById
          .mockResolvedValueOnce(
            null,
          );

        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              1,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'rejects an inactive Inventory store',
      async () => {
        inventoryRepository
          .findStoreById
          .mockResolvedValueOnce({
            id:
              storeId,

            isActive:
              false,
          });

        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              1,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects an unknown Inventory bin',
      async () => {
        inventoryRepository
          .findBinLocationById
          .mockResolvedValueOnce(
            null,
          );

        await expect(
          service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              1,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'rejects an inactive Inventory bin',
      async () => {
        inventoryRepository
          .findBinLocationById
          .mockResolvedValueOnce({
            id:
              binLocationId,

            storeId,

            isActive:
              false,
          });

        await expect(
          service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              1,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects a bin from another store',
      async () => {
        inventoryRepository
          .findBinLocationById
          .mockResolvedValueOnce({
            id:
              binLocationId,

            storeId:
              otherStoreId,

            isActive:
              true,
          });

        await expect(
          service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              1,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toThrow(
          'Inventory bin location does not belong to the selected store',
        );
      },
    );

    it(
      'does not query a bin when no bin is supplied',
      async () => {
        await service.allocate({
          itemId,
          storeId,

          quantity:
            1,

          strategy:
            InventoryBatchAllocationStrategy
              .FIFO,
        });

        expect(
          inventoryRepository
            .findBinLocationById,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
