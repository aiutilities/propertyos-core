import {
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryBatchService,
} from '../../src/core/inventory/services/inventory-batch.service';

describe(
  'Inventory Batch bulk lookup',
  () => {
    const firstBatchId =
      '11111111-1111-4111-8111-111111111111';

    const secondBatchId =
      '22222222-2222-4222-8222-222222222222';

    let batchRepository:
      any;

    let inventoryRepository:
      any;

    let service:
      InventoryBatchService;

    beforeEach(
      () => {
        batchRepository = {
          findByIds:
            jest.fn(),

          findById:
            jest.fn(),

          findByItemAndBatchNumber:
            jest.fn(),

          create:
            jest.fn(),
        };

        inventoryRepository = {
          findItemById:
            jest.fn(),
        };

        service =
          new InventoryBatchService(
            batchRepository,
            inventoryRepository,
          );
      },
    );

    it(
      'returns Batches in the requested order',
      async () => {
        batchRepository
          .findByIds
          .mockResolvedValue([
            {
              id:
                secondBatchId,

              itemId:
                '33333333-3333-4333-8333-333333333333',

              batchNumber:
                'BATCH-B',

              metadata: {},

              status:
                'ACTIVE',

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            },
            {
              id:
                firstBatchId,

              itemId:
                '33333333-3333-4333-8333-333333333333',

              batchNumber:
                'BATCH-A',

              metadata: {},

              status:
                'ACTIVE',

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            },
          ]);

        const result =
          await service.getByIds([
            secondBatchId,
            firstBatchId,
          ]);

        expect(
          result.map(
            (batch) =>
              batch.id,
          ),
        ).toEqual([
          secondBatchId,
          firstBatchId,
        ]);
      },
    );

    it(
      'deduplicates requested identifiers',
      async () => {
        batchRepository
          .findByIds
          .mockResolvedValue([
            {
              id:
                firstBatchId,

              itemId:
                '33333333-3333-4333-8333-333333333333',

              batchNumber:
                'BATCH-A',

              metadata: {},

              status:
                'ACTIVE',

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            },
          ]);

        await service.getByIds([
          firstBatchId,
          firstBatchId,
        ]);

        expect(
          batchRepository
            .findByIds,
        ).toHaveBeenCalledWith([
          firstBatchId,
        ]);
      },
    );

    it(
      'returns an empty result for an empty request',
      async () => {
        await expect(
          service.getByIds([]),
        ).resolves.toEqual([]);

        expect(
          batchRepository
            .findByIds,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects missing Batch identifiers',
      async () => {
        batchRepository
          .findByIds
          .mockResolvedValue([
            {
              id:
                firstBatchId,

              itemId:
                '33333333-3333-4333-8333-333333333333',

              batchNumber:
                'BATCH-A',

              metadata: {},

              status:
                'ACTIVE',

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            },
          ]);

        await expect(
          service.getByIds([
            firstBatchId,
            secondBatchId,
          ]),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
