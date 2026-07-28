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
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  InventoryStockLedgerRepository,
  PostInventoryMovementResult,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryAdjustmentStatus,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockMovementType,
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
  'InventoryStockAdjustmentService posting FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryStockLedgerRepository>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let postingMetrics:
      InventoryPostingMetricsService;

    let service:
      InventoryStockAdjustmentService;

    const adjustmentDate =
      new Date(
        '2026-07-28T00:00:00.000Z',
      );

    const adjustment:
      InventoryStockAdjustment = {
        id:
          'adjustment-1',
        adjustmentNumber:
          'ADJ-20260728-0001',
        propertyId:
          'property-1',
        storeId:
          'store-1',
        status:
          InventoryAdjustmentStatus.DRAFT,
        adjustmentDate,
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
        createdAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
          ),
      };

    const positiveItem:
      InventoryStockAdjustmentItem = {
        id:
          'adjustment-item-1',
        adjustmentId:
          adjustment.id,
        itemId:
          'item-1',
        binLocationId:
          'bin-1',
        quantityDelta:
          4,
        unitCost:
          125,
        remarks:
          'Positive variance',
        createdAt:
          new Date(),
      };

    const negativeItem:
      InventoryStockAdjustmentItem = {
        id:
          'adjustment-item-2',
        adjustmentId:
          adjustment.id,
        itemId:
          'item-2',
        quantityDelta:
          -2,
        unitCost:
          75,
        createdAt:
          new Date(),
      };

    const postedAdjustment:
      InventoryStockAdjustment = {
        ...adjustment,
        status:
          InventoryAdjustmentStatus.POSTED,
        postedByPersonId:
          'founder-person-2',
        postedAt:
          new Date(
            '2026-07-28T01:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-28T01:00:00.000Z',
          ),
      };

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

    beforeEach(() => {
      repository = {
        findAdjustmentById:
          jest.fn(),
        postMovement:
          jest.fn(),
        updateAdjustmentStatus:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

      repository.findAdjustmentById
        .mockResolvedValue({
          adjustment,
          items: [
            positiveItem,
            negativeItem,
          ],
        });

      repository.postMovement
        .mockResolvedValue(
          movementResult,
        );

      repository.updateAdjustmentStatus
        .mockResolvedValue(
          postedAdjustment,
        );

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

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      postingMetrics = {
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

      jest.spyOn(
        postingMetrics,
        'observe',
      );

      service =
        new InventoryStockAdjustmentService(
          repository,
          {} as InventoryService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'posts positive and negative adjustment lines with matching movement types',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValueOnce({
            adjustment,
            items: [
              positiveItem,
              negativeItem,
            ],
          })
          .mockResolvedValueOnce({
            adjustment:
              postedAdjustment,
            items: [
              positiveItem,
              negativeItem,
            ],
          });

        const result =
          await service.postAdjustment(
            adjustment.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          );

        expect(
          postingMetrics.observe,
        ).toHaveBeenCalledWith(
          'stock_adjustment',
          expect.any(Function),
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(2);

        expect(
          repository.postMovement,
        ).toHaveBeenNthCalledWith(
          1,
          {
            movementType:
              InventoryStockMovementType
                .ADJUSTMENT_IN,
            itemId:
              positiveItem.itemId,
            storeId:
              adjustment.storeId,
            binLocationId:
              positiveItem
                .binLocationId,
            quantityDelta:
              4,
            unitCost:
              125,
            sourceType:
              'inventory.stock_adjustment',
            sourceId:
              adjustment.id,
            sourceLineId:
              positiveItem.id,
            referenceNumber:
              adjustment
                .adjustmentNumber,
            idempotencyKey:
              'inventory-adjustment:adjustment-1:adjustment-item-1',
            correlationId:
              adjustment.id,
            movementDate:
              adjustmentDate,
            postedByPersonId:
              'founder-person-2',
            remarks:
              positiveItem.remarks,
            metadata: {
              adjustmentId:
                adjustment.id,
              adjustmentNumber:
                adjustment
                  .adjustmentNumber,
              propertyId:
                adjustment.propertyId,
              storeId:
                adjustment.storeId,
              reasonCode:
                adjustment.reasonCode,
              reasonDescription:
                adjustment
                  .reasonDescription,
              adjustmentItemId:
                positiveItem.id,
            },
          },
        );

        expect(
          repository.postMovement,
        ).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .ADJUSTMENT_OUT,
            itemId:
              negativeItem.itemId,
            quantityDelta:
              -2,
            unitCost:
              75,
            remarks:
              adjustment.remarks,
            idempotencyKey:
              'inventory-adjustment:adjustment-1:adjustment-item-2',
            correlationId:
              adjustment.id,
            metadata:
              expect.objectContaining({
                adjustmentItemId:
                  negativeItem.id,
              }),
          }),
        );

        expect(
          repository
            .updateAdjustmentStatus,
        ).toHaveBeenCalledWith(
          adjustment.id,
          expect.objectContaining({
            status:
              InventoryAdjustmentStatus
                .POSTED,
            postedByPersonId:
              'founder-person-2',
            postedAt:
              expect.any(Date),
            updatedAt:
              expect.any(Date),
          }),
        );

        expect(
          result.adjustment.status,
        ).toBe(
          InventoryAdjustmentStatus.POSTED,
        );
      },
    );

    it(
      'records Stock Adjustment posting event and audit evidence',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValueOnce({
            adjustment,
            items: [
              positiveItem,
              negativeItem,
            ],
          })
          .mockResolvedValueOnce({
            adjustment:
              postedAdjustment,
            items: [
              positiveItem,
              negativeItem,
            ],
          });

        await service.postAdjustment(
          adjustment.id,
          {
            postedByPersonId:
              'founder-person-2',
          },
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_adjustment',
            entityId:
              adjustment.id,
            adjustmentId:
              adjustment.id,
            adjustmentNumber:
              adjustment.adjustmentNumber,
            propertyId:
              adjustment.propertyId,
            storeId:
              adjustment.storeId,
            reasonCode:
              adjustment.reasonCode,
            itemCount:
              2,
            actorPersonId:
              'founder-person-2',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_ADJUSTED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_ADJUSTED,
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'rejects posting an adjustment outside DRAFT status',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValue({
            adjustment: {
              ...adjustment,
              status:
                InventoryAdjustmentStatus
                  .POSTED,
            },
            items: [
              positiveItem,
            ],
          });

        await expect(
          service.postAdjustment(
            adjustment.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();

        expect(
          repository
            .updateAdjustmentStatus,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects posting an adjustment with no items',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValue({
            adjustment,
            items:
              [],
          });

        await expect(
          service.postAdjustment(
            adjustment.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown adjustment before posting',
      async () => {
        repository.findAdjustmentById
          .mockResolvedValue(null);

        await expect(
          service.postAdjustment(
            'missing-adjustment',
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'fails closed when the status transition cannot find the adjustment',
      async () => {
        repository.updateAdjustmentStatus
          .mockResolvedValue(null);

        await expect(
          service.postAdjustment(
            adjustment.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(2);

        expect(
          eventBus.publish,
        ).not.toHaveBeenCalled();

        expect(
          auditService.record,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
