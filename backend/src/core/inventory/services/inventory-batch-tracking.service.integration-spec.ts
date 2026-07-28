import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryBatchAllocationRepository,
} from '../repositories/inventory-batch-allocation.repository';

import {
  InventoryBatchRepository,
} from '../repositories/inventory-batch.repository';

import {
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBatch,
  InventoryBatchAllocationStrategy,
  InventoryBatchStatus,
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryBatchAllocationService,
} from './inventory-batch-allocation.service';

import {
  InventoryBatchService,
} from './inventory-batch.service';

describe(
  'Inventory Batch Tracking FAT contract',
  () => {
    let batchRepository:
      jest.Mocked<InventoryBatchRepository>;

    let allocationRepository:
      jest.Mocked<
        InventoryBatchAllocationRepository
      >;

    let inventoryRepository:
      jest.Mocked<InventoryRepository>;

    let batchService:
      InventoryBatchService;

    let allocationService:
      InventoryBatchAllocationService;

    const futureExpiry =
      new Date(
        '2030-12-31T00:00:00.000Z',
      );

    const manufactureDate =
      new Date(
        '2026-07-01T00:00:00.000Z',
      );

    const item:
      InventoryItem = {
        id:
          'item-1',
        sku:
          'MED-001',
        name:
          'Batch-tracked consumable',
        categoryId:
          'category-1',
        unitOfMeasureId:
          'unit-1',
        itemType:
          InventoryItemType.GOODS,
        minimumStockLevel:
          0,
        reorderLevel:
          0,
        reorderQuantity:
          0,
        standardCost:
          100,
        currency:
          'INR',
        isSerialized:
          false,
        isBatchTracked:
          true,
        isActive:
          true,
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const store:
      InventoryStore = {
        id:
          'store-1',
        storeCode:
          'MAIN',
        name:
          'Main Store',
        propertyId:
          'property-1',
        isActive:
          true,
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const bin:
      InventoryBinLocation = {
        id:
          'bin-1',
        storeId:
          store.id,
        binCode:
          'BATCH-01',
        name:
          'Batch Bin',
        isReceivingBin:
          true,
        isDispatchBin:
          true,
        isQuarantineBin:
          false,
        isActive:
          true,
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const batch:
      InventoryBatch = {
        id:
          'batch-1',
        itemId:
          item.id,
        batchNumber:
          'BATCH-001',
        manufacturerBatchNumber:
          'MFG-001',
        manufactureDate,
        expiryDate:
          futureExpiry,
        status:
          InventoryBatchStatus.ACTIVE,
        sourceType:
          'procurement.goods_receipt',
        sourceId:
          'goods-receipt-1',
        sourceLineId:
          'goods-receipt-item-1',
        remarks:
          'Founder Batch',
        metadata: {
          source:
            'FAT',
        },
        createdByPersonId:
          'founder-person-1',
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    beforeEach(() => {
      batchRepository = {
        findByIds:
          jest.fn(),
        findByItemAndBatchNumber:
          jest.fn(),
        create:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryBatchRepository>;

      allocationRepository = {
        findAvailableBatches:
          jest.fn(),
      } as unknown as
        jest.Mocked<
          InventoryBatchAllocationRepository
        >;

      inventoryRepository = {
        findItemById:
          jest.fn(),
        findStoreById:
          jest.fn(),
        findBinLocationById:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryRepository>;

      inventoryRepository
        .findItemById
        .mockResolvedValue(item);

      inventoryRepository
        .findStoreById
        .mockResolvedValue(store);

      inventoryRepository
        .findBinLocationById
        .mockResolvedValue(bin);

      batchRepository
        .findByItemAndBatchNumber
        .mockResolvedValue(null);

      batchRepository.create
        .mockImplementation(
          async (
            input:
              InventoryBatch,
          ) => input,
        );

      batchService =
        new InventoryBatchService(
          batchRepository,
          inventoryRepository,
        );

      allocationService =
        new InventoryBatchAllocationService(
          allocationRepository,
          inventoryRepository,
        );
    });

    it(
      'creates a normalized active Batch for a Batch-tracked item',
      async () => {
        const result =
          await batchService
            .resolveOrCreate({
              itemId:
                item.id,
              batchNumber:
                ' BATCH-001 ',
              manufacturerBatchNumber:
                ' MFG-001 ',
              manufactureDate,
              expiryDate:
                futureExpiry,
              sourceType:
                ' procurement.goods_receipt ',
              sourceId:
                'goods-receipt-1',
              sourceLineId:
                'goods-receipt-item-1',
              remarks:
                ' Founder Batch ',
              metadata: {
                source:
                  'FAT',
              },
              createdByPersonId:
                'founder-person-1',
            });

        expect(
          batchRepository
            .findByItemAndBatchNumber,
        ).toHaveBeenCalledWith(
          item.id,
          'BATCH-001',
        );

        expect(
          batchRepository.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
            manufacturerBatchNumber:
              'MFG-001',
            manufactureDate,
            expiryDate:
              futureExpiry,
            status:
              InventoryBatchStatus.ACTIVE,
            sourceType:
              'procurement.goods_receipt',
            sourceId:
              'goods-receipt-1',
            sourceLineId:
              'goods-receipt-item-1',
            remarks:
              'Founder Batch',
            metadata: {
              source:
                'FAT',
            },
            createdByPersonId:
              'founder-person-1',
          }),
        );

        expect(result).toEqual(
          expect.objectContaining({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
            status:
              InventoryBatchStatus.ACTIVE,
          }),
        );
      },
    );

    it(
      'reuses a matching active Batch without duplicate persistence',
      async () => {
        batchRepository
          .findByItemAndBatchNumber
          .mockResolvedValue(batch);

        await expect(
          batchService.resolveOrCreate({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
            manufacturerBatchNumber:
              'MFG-001',
            manufactureDate,
            expiryDate:
              futureExpiry,
          }),
        ).resolves.toEqual(batch);

        expect(
          batchRepository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'loads unique Batch IDs and rejects missing entities',
      async () => {
        batchRepository.findByIds
          .mockResolvedValue([
            batch,
          ]);

        await expect(
          batchService.getByIds([
            ' batch-1 ',
            'batch-1',
          ]),
        ).resolves.toEqual([
          batch,
        ]);

        expect(
          batchRepository.findByIds,
        ).toHaveBeenCalledWith([
          'batch-1',
        ]);

        batchRepository.findByIds
          .mockResolvedValue([]);

        await expect(
          batchService.getByIds([
            'missing-batch',
          ]),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'rejects Batch use for a non-Batch-tracked item',
      async () => {
        inventoryRepository
          .findItemById
          .mockResolvedValue({
            ...item,
            isBatchTracked:
              false,
          });

        await expect(
          batchService.resolveOrCreate({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          batchRepository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects invalid Batch dates and conflicting existing metadata',
      async () => {
        await expect(
          batchService.resolveOrCreate({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
            manufactureDate:
              futureExpiry,
            expiryDate:
              manufactureDate,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        batchRepository
          .findByItemAndBatchNumber
          .mockResolvedValue(batch);

        await expect(
          batchService.resolveOrCreate({
            itemId:
              item.id,
            batchNumber:
              'BATCH-001',
            manufacturerBatchNumber:
              'CONFLICTING-MFG',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'allocates across available Batches and reports complete allocation',
      async () => {
        allocationRepository
          .findAvailableBatches
          .mockResolvedValue([
            {
              batchId:
                'batch-1',
              itemId:
                item.id,
              storeId:
                store.id,
              binLocationId:
                bin.id,
              batchNumber:
                'BATCH-001',
              manufactureDate:
                new Date(
                  '2026-01-01',
                ),
              expiryDate:
                new Date(
                  '2027-01-01',
                ),
              batchStatus:
                InventoryBatchStatus
                  .ACTIVE,
              quantityOnHand:
                3,
              reservedQuantity:
                0,
              availableQuantity:
                3,
              averageUnitCost:
                100,
              batchCreatedAt:
                new Date(
                  '2026-01-01',
                ),
            },
            {
              batchId:
                'batch-2',
              itemId:
                item.id,
              storeId:
                store.id,
              binLocationId:
                bin.id,
              batchNumber:
                'BATCH-002',
              manufactureDate:
                new Date(
                  '2026-02-01',
                ),
              expiryDate:
                new Date(
                  '2027-02-01',
                ),
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
                110,
              batchCreatedAt:
                new Date(
                  '2026-02-01',
                ),
            },
          ]);

        const asOf =
          new Date(
            '2026-07-28T00:00:00.000Z',
          );

        const result =
          await allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantity:
              5,
            strategy:
              InventoryBatchAllocationStrategy
                .FEFO,
            asOf,
            strict:
              true,
          });

        expect(
          allocationRepository
            .findAvailableBatches,
        ).toHaveBeenCalledWith({
          itemId:
            item.id,
          storeId:
            store.id,
          binLocationId:
            bin.id,
          strategy:
            InventoryBatchAllocationStrategy
              .FEFO,
          manualBatchIds:
            undefined,
          asOf,
        });

        expect(result).toEqual({
          itemId:
            item.id,
          storeId:
            store.id,
          binLocationId:
            bin.id,
          strategy:
            InventoryBatchAllocationStrategy
              .FEFO,
          requestedQuantity:
            5,
          allocatedQuantity:
            5,
          shortageQuantity:
            0,
          fullyAllocated:
            true,
          allocations: [
            expect.objectContaining({
              batchId:
                'batch-1',
              availableQuantity:
                3,
              allocatedQuantity:
                3,
            }),
            expect.objectContaining({
              batchId:
                'batch-2',
              availableQuantity:
                4,
              allocatedQuantity:
                2,
            }),
          ],
        });
      },
    );

    it(
      'supports normalized unique MANUAL Batch selection',
      async () => {
        allocationRepository
          .findAvailableBatches
          .mockResolvedValue([]);

        await allocationService.allocate({
          itemId:
            item.id,
          storeId:
            store.id,
          quantity:
            1,
          strategy:
            InventoryBatchAllocationStrategy
              .MANUAL,
          manualBatchIds: [
            ' batch-2 ',
            'batch-1',
            'batch-2',
          ],
        });

        expect(
          allocationRepository
            .findAvailableBatches,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            strategy:
              InventoryBatchAllocationStrategy
                .MANUAL,
            manualBatchIds: [
              'batch-2',
              'batch-1',
            ],
          }),
        );
      },
    );

    it(
      'reports shortages in preview mode and rejects them in strict mode',
      async () => {
        allocationRepository
          .findAvailableBatches
          .mockResolvedValue([
            {
              batchId:
                'batch-1',
              itemId:
                item.id,
              storeId:
                store.id,
              batchNumber:
                'BATCH-001',
              batchStatus:
                InventoryBatchStatus
                  .ACTIVE,
              quantityOnHand:
                2,
              reservedQuantity:
                0,
              availableQuantity:
                2,
              averageUnitCost:
                100,
              batchCreatedAt:
                new Date(),
            },
          ]);

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              5,
            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
            strict:
              false,
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            requestedQuantity:
              5,
            allocatedQuantity:
              2,
            shortageQuantity:
              3,
            fullyAllocated:
              false,
          }),
        );

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              5,
            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
            strict:
              true,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects invalid allocation inputs before availability lookup',
      async () => {
        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              0,
            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            strategy:
              InventoryBatchAllocationStrategy
                .MANUAL,
            manualBatchIds:
              [],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          allocationRepository
            .findAvailableBatches,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects inactive items, stores, and foreign bins',
      async () => {
        inventoryRepository
          .findItemById
          .mockResolvedValueOnce({
            ...item,
            isActive:
              false,
          });

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        inventoryRepository
          .findItemById
          .mockResolvedValue(item);

        inventoryRepository
          .findStoreById
          .mockResolvedValueOnce({
            ...store,
            isActive:
              false,
          });

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            strategy:
              InventoryBatchAllocationStrategy
                .FIFO,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        inventoryRepository
          .findStoreById
          .mockResolvedValue(store);

        inventoryRepository
          .findBinLocationById
          .mockResolvedValueOnce({
            ...bin,
            storeId:
              'foreign-store',
          });

        await expect(
          allocationService.allocate({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
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
  },
);
