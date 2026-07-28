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
  AuditService,
} from '../../audit/audit.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryAdjustmentStatus,
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

import {
  InventoryService,
} from './inventory.service';

import {
  InventoryStockAdjustmentService,
} from './inventory-stock-adjustment.service';

describe(
  'InventoryStockAdjustmentService foundation FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryStockLedgerRepository>;

    let inventoryService:
      jest.Mocked<
        Pick<
          InventoryService,
          | 'getStore'
          | 'getItem'
          | 'getBinLocation'
        >
      >;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryStockAdjustmentService;

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

    const item:
      InventoryItem = {
        id:
          'item-1',
        sku:
          'SW-001',
        name:
          'Modular Switch',
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
          125,
        currency:
          'INR',
        isSerialized:
          false,
        isBatchTracked:
          false,
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
          'ADJUST-01',
        name:
          'Adjustment Bin',
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

    beforeEach(() => {
      repository = {
        createAdjustment:
          jest.fn(),
        findAdjustmentById:
          jest.fn(),
        listAdjustments:
          jest.fn(),
        updateAdjustmentStatus:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

      inventoryService = {
        getStore:
          jest.fn(),
        getItem:
          jest.fn(),
        getBinLocation:
          jest.fn(),
      };

      eventBus = {
        publish:
          jest.fn(),
      } as unknown as
        jest.Mocked<EventBusService>;

      auditService = {
        record:
          jest.fn(),
      } as unknown as
        jest.Mocked<AuditService>;

      inventoryService
        .getStore
        .mockResolvedValue(store);

      inventoryService
        .getItem
        .mockResolvedValue(item);

      inventoryService
        .getBinLocation
        .mockResolvedValue(bin);

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      const postingMetrics = {
        observe:
          async <T>(
            _operation:
              Parameters<
                InventoryPostingMetricsService[
                  'observe'
                ]
              >[0],
            work:
              () => Promise<T>,
          ): Promise<T> =>
            work(),
      } as InventoryPostingMetricsService;

      service =
        new InventoryStockAdjustmentService(
          repository,
          inventoryService as unknown as
            InventoryService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'creates a normalized draft Stock Adjustment and records evidence',
      async () => {
        repository.createAdjustment
          .mockImplementation(
            async (
              adjustment:
                InventoryStockAdjustment,
              items:
                InventoryStockAdjustmentItem[],
            ) => ({
              adjustment,
              items,
            }),
          );

        const result =
          await service.createAdjustment({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            adjustmentDate:
              '2026-07-28',
            reasonCode:
              ' cycle_count ',
            reasonDescription:
              ' Physical count variance ',
            createdByPersonId:
              'founder-person-1',
            remarks:
              ' Founder acceptance adjustment ',
            items: [
              {
                itemId:
                  item.id,
                binLocationId:
                  bin.id,
                quantityDelta:
                  4,
                unitCost:
                  125,
                remarks:
                  ' Positive variance ',
              },
              {
                itemId:
                  'item-2',
                quantityDelta:
                  -2,
                unitCost:
                  75,
                remarks:
                  ' Negative variance ',
              },
            ],
          });

        expect(
          result.adjustment,
        ).toEqual(
          expect.objectContaining({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryAdjustmentStatus
                .DRAFT,
            reasonCode:
              'CYCLE_COUNT',
            reasonDescription:
              'Physical count variance',
            createdByPersonId:
              'founder-person-1',
            remarks:
              'Founder acceptance adjustment',
            metadata:
              {},
          }),
        );

        expect(
          result.adjustment
            .adjustmentNumber,
        ).toMatch(
          /^ADJ-20260728-/,
        );

        expect(result.items).toEqual([
          expect.objectContaining({
            adjustmentId:
              result.adjustment.id,
            itemId:
              item.id,
            binLocationId:
              bin.id,
            quantityDelta:
              4,
            unitCost:
              125,
            remarks:
              'Positive variance',
          }),
          expect.objectContaining({
            adjustmentId:
              result.adjustment.id,
            itemId:
              'item-2',
            binLocationId:
              undefined,
            quantityDelta:
              -2,
            unitCost:
              75,
            remarks:
              'Negative variance',
          }),
        ]);

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_adjustment',
            entityId:
              result.adjustment.id,
            adjustmentId:
              result.adjustment.id,
            adjustmentNumber:
              result.adjustment
                .adjustmentNumber,
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            reasonCode:
              'CYCLE_COUNT',
            itemCount:
              2,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.adjustment.created',
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          'inventory.stock.adjustment.created',
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'lists Stock Adjustments using normalized filters',
      async () => {
        repository.listAdjustments
          .mockResolvedValue([]);

        await expect(
          service.listAdjustments({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              ' draft ',
            dateFrom:
              '2026-07-01',
            dateTo:
              '2026-07-31',
          }),
        ).resolves.toEqual([]);

        expect(
          repository.listAdjustments,
        ).toHaveBeenCalledWith({
          propertyId:
            store.propertyId,
          storeId:
            store.id,
          status:
            InventoryAdjustmentStatus
              .DRAFT,
          dateFrom:
            new Date(
              '2026-07-01',
            ),
          dateTo:
            new Date(
              '2026-07-31',
            ),
        });
      },
    );

    it(
      'retrieves an existing Stock Adjustment',
      async () => {
        const adjustment:
          InventoryStockAdjustment = {
            id:
              'adjustment-1',
            adjustmentNumber:
              'ADJ-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryAdjustmentStatus
                .DRAFT,
            adjustmentDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'CYCLE_COUNT',
            createdByPersonId:
              'founder-person-1',
            metadata:
              {},
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        const details = {
          adjustment,
          items:
            [],
        };

        repository.findAdjustmentById
          .mockResolvedValue(details);

        await expect(
          service.getAdjustment(
            adjustment.id,
          ),
        ).resolves.toEqual(
          details,
        );
      },
    );

    it(
      'cancels a draft Stock Adjustment and records evidence',
      async () => {
        const draft:
          InventoryStockAdjustment = {
            id:
              'adjustment-1',
            adjustmentNumber:
              'ADJ-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryAdjustmentStatus
                .DRAFT,
            adjustmentDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'CYCLE_COUNT',
            createdByPersonId:
              'founder-person-1',
            metadata:
              {},
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        const cancelled:
          InventoryStockAdjustment = {
            ...draft,
            status:
              InventoryAdjustmentStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancelledAt:
              new Date(),
            cancellationReason:
              'Incorrect count',
          };

        repository.findAdjustmentById
          .mockResolvedValueOnce({
            adjustment:
              draft,
            items:
              [],
          })
          .mockResolvedValueOnce({
            adjustment:
              cancelled,
            items:
              [],
          });

        repository.updateAdjustmentStatus
          .mockResolvedValue(
            cancelled,
          );

        const result =
          await service.cancelAdjustment(
            draft.id,
            {
              cancelledByPersonId:
                'founder-person-2',
              cancellationReason:
                ' Incorrect count ',
            },
          );

        expect(
          repository
            .updateAdjustmentStatus,
        ).toHaveBeenCalledWith(
          draft.id,
          expect.objectContaining({
            status:
              InventoryAdjustmentStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancellationReason:
              'Incorrect count',
          }),
        );

        expect(
          result.adjustment.status,
        ).toBe(
          InventoryAdjustmentStatus
            .CANCELLED,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.adjustment.cancelled',
          'core.inventory',
          expect.objectContaining({
            adjustmentId:
              draft.id,
            cancellationReason:
              'Incorrect count',
            actorPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'rejects a zero-quantity adjustment line',
      async () => {
        await expect(
          service.createAdjustment({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            adjustmentDate:
              '2026-07-28',
            reasonCode:
              'CYCLE_COUNT',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                quantityDelta:
                  0,
                unitCost:
                  125,
              },
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate item and bin combinations',
      async () => {
        await expect(
          service.createAdjustment({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            adjustmentDate:
              '2026-07-28',
            reasonCode:
              'CYCLE_COUNT',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                binLocationId:
                  bin.id,
                quantityDelta:
                  1,
                unitCost:
                  125,
              },
              {
                itemId:
                  item.id,
                binLocationId:
                  bin.id,
                quantityDelta:
                  -1,
                unitCost:
                  125,
              },
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an inactive Inventory store',
      async () => {
        inventoryService.getStore
          .mockResolvedValue({
            ...store,
            isActive:
              false,
          });

        await expect(
          service.createAdjustment({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            adjustmentDate:
              '2026-07-28',
            reasonCode:
              'CYCLE_COUNT',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                quantityDelta:
                  1,
                unitCost:
                  125,
              },
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Stock Adjustment',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValue(null);

        await expect(
          service.getAdjustment(
            'missing-adjustment',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
