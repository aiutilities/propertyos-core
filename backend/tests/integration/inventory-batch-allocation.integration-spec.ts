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
  'Inventory Batch Allocation service',
  () => {
    const itemId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const binLocationId =
      '33333333-3333-4333-8333-333333333333';

    const firstBatchId =
      '44444444-4444-4444-8444-444444444444';

    const secondBatchId =
      '55555555-5555-4555-8555-555555555555';

    const thirdBatchId =
      '66666666-6666-4666-8666-666666666666';

    let repository: any;
    let inventoryRepository: any;

    let service:
      InventoryBatchAllocationService;

    beforeEach(
      () => {
        repository = {
          findAvailableBatches:
            jest.fn(),
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
            repository,
            inventoryRepository,
          );
      },
    );

    function availability(
      batchId: string,
      batchNumber: string,
      availableQuantity: number,
      input: {
        manufactureDate?: string;
        expiryDate?: string;
        averageUnitCost?: number;
      } = {},
    ) {
      return {
        batchId,
        itemId,
        storeId,
        binLocationId,

        batchNumber,

        manufactureDate:
          input.manufactureDate
            ? new Date(
                input.manufactureDate,
              )
            : undefined,

        expiryDate:
          input.expiryDate
            ? new Date(
                input.expiryDate,
              )
            : undefined,

        batchStatus:
          InventoryBatchStatus
            .ACTIVE,

        quantityOnHand:
          availableQuantity,

        reservedQuantity:
          0,

        availableQuantity,

        averageUnitCost:
          input.averageUnitCost ??
          10,

        batchCreatedAt:
          new Date(
            '2026-01-01T00:00:00.000Z',
          ),
      };
    }

    it(
      'allocates one Batch when it fully satisfies the request',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([
            availability(
              firstBatchId,
              'BATCH-A',
              10,
            ),
          ]);

        const result =
          await service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              6,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          });

        expect(
          result,
        ).toEqual({
          itemId,
          storeId,
          binLocationId,

          strategy:
            InventoryBatchAllocationStrategy
              .FIFO,

          requestedQuantity:
            6,

          allocatedQuantity:
            6,

          shortageQuantity:
            0,

          fullyAllocated:
            true,

          allocations: [
            expect.objectContaining({
              batchId:
                firstBatchId,

              batchNumber:
                'BATCH-A',

              availableQuantity:
                10,

              allocatedQuantity:
                6,
            }),
          ],
        });
      },
    );

    it(
      'splits allocation across multiple Batches',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([
            availability(
              firstBatchId,
              'BATCH-A',
              3,
            ),

            availability(
              secondBatchId,
              'BATCH-B',
              5,
            ),

            availability(
              thirdBatchId,
              'BATCH-C',
              7,
            ),
          ]);

        const result =
          await service.allocate({
            itemId,
            storeId,
            binLocationId,

            quantity:
              10,

            strategy:
              InventoryBatchAllocationStrategy
                .FEFO,
          });

        expect(
          result.allocations.map(
            (line) => ({
              batchId:
                line.batchId,

              quantity:
                line.allocatedQuantity,
            }),
          ),
        ).toEqual([
          {
            batchId:
              firstBatchId,

            quantity:
              3,
          },
          {
            batchId:
              secondBatchId,

            quantity:
              5,
          },
          {
            batchId:
              thirdBatchId,

            quantity:
              2,
          },
        ]);

        expect(
          result.allocatedQuantity,
        ).toBe(10);

        expect(
          result.shortageQuantity,
        ).toBe(0);

        expect(
          result.fullyAllocated,
        ).toBe(true);
      },
    );

    it(
      'reports a shortage when stock is insufficient',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([
            availability(
              firstBatchId,
              'BATCH-A',
              2,
            ),

            availability(
              secondBatchId,
              'BATCH-B',
              3,
            ),
          ]);

        const result =
          await service.allocate({
            itemId,
            storeId,

            quantity:
              8,

            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          });

        expect(
          result.allocatedQuantity,
        ).toBe(5);

        expect(
          result.shortageQuantity,
        ).toBe(3);

        expect(
          result.fullyAllocated,
        ).toBe(false);
      },
    );

    it(
      'returns an empty partial result when no eligible stock exists',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([]);

        const result =
          await service.allocate({
            itemId,
            storeId,

            quantity:
              4,

            strategy:
              InventoryBatchAllocationStrategy
                .FEFO,
          });

        expect(
          result.allocations,
        ).toEqual([]);

        expect(
          result.allocatedQuantity,
        ).toBe(0);

        expect(
          result.shortageQuantity,
        ).toBe(4);

        expect(
          result.fullyAllocated,
        ).toBe(false);
      },
    );

    it(
      'passes MANUAL Batch order to the repository',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([
            availability(
              secondBatchId,
              'BATCH-B',
              5,
            ),

            availability(
              firstBatchId,
              'BATCH-A',
              5,
            ),
          ]);

        const result =
          await service.allocate({
            itemId,
            storeId,

            quantity:
              7,

            strategy:
              InventoryBatchAllocationStrategy
                .MANUAL,

            manualBatchIds: [
              secondBatchId,
              firstBatchId,
              secondBatchId,
            ],
          });

        expect(
          repository
            .findAvailableBatches,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            strategy:
              InventoryBatchAllocationStrategy
                .MANUAL,

            manualBatchIds: [
              secondBatchId,
              firstBatchId,
            ],
          }),
        );

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).toEqual([
          secondBatchId,
          firstBatchId,
        ]);

        expect(
          result.allocations.map(
            (line) =>
              line.allocatedQuantity,
          ),
        ).toEqual([
          5,
          2,
        ]);
      },
    );

    it(
      'requires manualBatchIds for MANUAL allocation',
      async () => {
        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              2,

            strategy:
              InventoryBatchAllocationStrategy
                .MANUAL,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .findAvailableBatches,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a non-positive requested quantity',
      async () => {
        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              0,

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
      'rejects an unknown Inventory item',
      async () => {
        inventoryRepository
          .findItemById
          .mockResolvedValueOnce(
            null,
          );

        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              2,

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
      'rejects a non-batch-tracked Inventory item',
      async () => {
        inventoryRepository
          .findItemById
          .mockResolvedValueOnce({
            id:
              itemId,

            isActive:
              true,

            isBatchTracked:
              false,
          });

        await expect(
          service.allocate({
            itemId,
            storeId,

            quantity:
              2,

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
      'does not mutate stock, reservations or ledger state',
      async () => {
        repository
          .findAvailableBatches
          .mockResolvedValue([
            availability(
              firstBatchId,
              'BATCH-A',
              10,
            ),
          ]);

        await service.allocate({
          itemId,
          storeId,

          quantity:
            2,

          strategy:
            InventoryBatchAllocationStrategy
              .FIFO,
        });

        expect(
          Object.keys(repository),
        ).toEqual([
          'findAvailableBatches',
        ]);
      },
    );
  },
);
