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
  InventoryStockLedgerTransaction,
  PostInventoryMovementResult,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryMaterialIssue,
  InventoryMaterialIssueItem,
  InventoryMaterialIssueStatus,
  InventoryMaterialReturn,
  InventoryMaterialReturnItem,
  InventoryMaterialReturnStatus,
  InventoryStockMovementType,
} from '../types/inventory.types';

import {
  InventoryBatchService,
} from './inventory-batch.service';

import {
  InventoryMaterialReturnService,
} from './inventory-material-return.service';

import {
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryMaterialReturnService posting FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryStockLedgerRepository>;

    let transaction:
      jest.Mocked<InventoryStockLedgerTransaction>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let postingMetrics:
      InventoryPostingMetricsService;

    let service:
      InventoryMaterialReturnService;

    const returnDate =
      new Date(
        '2026-07-28T00:00:00.000Z',
      );

    const originalIssue:
      InventoryMaterialIssue = {
        id:
          'material-issue-1',
        issueNumber:
          'MI-20260727-0001',
        propertyId:
          'property-1',
        storeId:
          'store-1',
        status:
          InventoryMaterialIssueStatus
            .POSTED,
        issueDate:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
        reasonCode:
          'MAINTENANCE',
        reasonDescription:
          'Electrical repair',
        requestedByPersonId:
          'requester-person-1',
        createdByPersonId:
          'founder-person-1',
        postedByPersonId:
          'founder-person-2',
        postedAt:
          new Date(
            '2026-07-27T01:00:00.000Z',
          ),
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const originalIssueItem:
      InventoryMaterialIssueItem = {
        id:
          'material-issue-item-1',
        materialIssueId:
          originalIssue.id,
        itemId:
          'item-1',
        binLocationId:
          'bin-1',
        batchId:
          'batch-1',
        quantity:
          5,
        unitCost:
          125,
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const materialReturn:
      InventoryMaterialReturn = {
        id:
          'material-return-1',
        returnNumber:
          'MR-20260728-0001',
        propertyId:
          'property-1',
        storeId:
          'store-1',
        materialIssueId:
          originalIssue.id,
        status:
          InventoryMaterialReturnStatus
            .DRAFT,
        returnDate,
        reasonCode:
          'UNUSED',
        reasonDescription:
          'Unused maintenance stock',
        returnedByPersonId:
          'technician-person-1',
        createdByPersonId:
          'founder-person-1',
        remarks:
          'Return unused stock',
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const firstItem:
      InventoryMaterialReturnItem = {
        id:
          'material-return-item-1',
        materialReturnId:
          materialReturn.id,
        itemId:
          'item-1',
        binLocationId:
          'bin-1',
        batchId:
          'batch-1',
        quantity:
          2,
        unitCost:
          125,
        remarks:
          'Return switches',
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const postedReturn:
      InventoryMaterialReturn = {
        ...materialReturn,
        status:
          InventoryMaterialReturnStatus
            .POSTED,
        postedByPersonId:
          'founder-person-3',
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
      transaction = {
        acquireLock:
          jest.fn(),
        lockMaterialReturnById:
          jest.fn(),
        lockMaterialIssueById:
          jest.fn(),
        getPostedMaterialReturnQuantity:
          jest.fn(),
        postMovement:
          jest.fn(),
        updateMaterialReturnStatus:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerTransaction>;

      repository = {
        withTransaction:
          jest.fn(),
        findMaterialReturnById:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

      repository.withTransaction
        .mockImplementation(
          async <T>(
            work:
              (
                transaction:
                  InventoryStockLedgerTransaction,
              ) => Promise<T>,
          ): Promise<T> =>
            work(transaction),
        );

      transaction
        .lockMaterialReturnById
        .mockResolvedValue({
          materialReturn,
          items: [
            firstItem,
          ],
        });

      transaction
        .lockMaterialIssueById
        .mockResolvedValue({
          materialIssue:
            originalIssue,
          items: [
            originalIssueItem,
          ],
        });

      transaction
        .getPostedMaterialReturnQuantity
        .mockResolvedValue(0);

      transaction.postMovement
        .mockResolvedValue(
          movementResult,
        );

      transaction
        .updateMaterialReturnStatus
        .mockResolvedValue(
          postedReturn,
        );

      repository
        .findMaterialReturnById
        .mockResolvedValue({
          materialReturn:
            postedReturn,
          items: [
            firstItem,
          ],
        });

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
        new InventoryMaterialReturnService(
          repository,
          {} as InventoryService,
          {} as InventoryBatchService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'posts a linked Material Return as an idempotent RECEIPT movement',
      async () => {
        const result =
          await service
            .postMaterialReturn(
              materialReturn.id,
              {
                postedByPersonId:
                  'founder-person-3',
              },
            );

        expect(
          postingMetrics.observe,
        ).toHaveBeenCalledWith(
          'material_return',
          expect.any(Function),
        );

        expect(
          repository.withTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          transaction
            .lockMaterialReturnById,
        ).toHaveBeenCalledWith(
          materialReturn.id,
        );

        expect(
          transaction.acquireLock,
        ).toHaveBeenCalledWith(
          'inventory-material-return:material-issue-1',
        );

        expect(
          transaction
            .lockMaterialIssueById,
        ).toHaveBeenCalledWith(
          originalIssue.id,
        );

        expect(
          transaction
            .getPostedMaterialReturnQuantity,
        ).toHaveBeenCalledWith(
          originalIssue.id,
          firstItem.itemId,
          firstItem.binLocationId,
          firstItem.batchId,
        );

        expect(
          transaction.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          transaction.postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType
              .RECEIPT,
          itemId:
            firstItem.itemId,
          storeId:
            materialReturn.storeId,
          binLocationId:
            firstItem.binLocationId,
          batchId:
            firstItem.batchId,
          quantityDelta:
            2,
          unitCost:
            125,
          sourceType:
            'inventory.material_return',
          sourceId:
            materialReturn.id,
          sourceLineId:
            firstItem.id,
          referenceNumber:
            materialReturn.returnNumber,
          idempotencyKey:
            'inventory-material-return:material-return-1:material-return-item-1',
          correlationId:
            originalIssue.id,
          movementDate:
            returnDate,
          postedByPersonId:
            'founder-person-3',
          remarks:
            firstItem.remarks,
          metadata: {
            materialReturnId:
              materialReturn.id,
            returnNumber:
              materialReturn.returnNumber,
            materialIssueId:
              originalIssue.id,
            propertyId:
              materialReturn.propertyId,
            storeId:
              materialReturn.storeId,
            reasonCode:
              materialReturn.reasonCode,
            reasonDescription:
              materialReturn
                .reasonDescription,
            materialReturnItemId:
              firstItem.id,
            batchId:
              firstItem.batchId,
            returnedByPersonId:
              materialReturn
                .returnedByPersonId,
          },
        });

        expect(
          transaction
            .updateMaterialReturnStatus,
        ).toHaveBeenCalledWith(
          materialReturn.id,
          expect.objectContaining({
            status:
              InventoryMaterialReturnStatus
                .POSTED,
            postedByPersonId:
              'founder-person-3',
            postedAt:
              expect.any(Date),
            updatedAt:
              expect.any(Date),
          }),
        );

        expect(
          result.materialReturn.status,
        ).toBe(
          InventoryMaterialReturnStatus
            .POSTED,
        );
      },
    );

    it(
      'records Material Return posting event and audit evidence',
      async () => {
        await service.postMaterialReturn(
          materialReturn.id,
          {
            postedByPersonId:
              'founder-person-3',
          },
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.material_return',
            entityId:
              materialReturn.id,
            materialReturnId:
              materialReturn.id,
            returnNumber:
              materialReturn.returnNumber,
            materialIssueId:
              originalIssue.id,
            propertyId:
              materialReturn.propertyId,
            storeId:
              materialReturn.storeId,
            reasonCode:
              materialReturn.reasonCode,
            itemCount:
              1,
            actorPersonId:
              'founder-person-3',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_RETURN_POSTED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_RETURN_POSTED,
          'core.inventory',
          evidence,
        );

        expect(
          repository
            .findMaterialReturnById,
        ).toHaveBeenCalledWith(
          materialReturn.id,
        );
      },
    );

    it(
      'rejects posting a Material Return outside DRAFT status',
      async () => {
        transaction
          .lockMaterialReturnById
          .mockResolvedValue({
            materialReturn: {
              ...materialReturn,
              status:
                InventoryMaterialReturnStatus
                  .POSTED,
            },
            items: [
              firstItem,
            ],
          });

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects posting a Material Return with no items',
      async () => {
        transaction
          .lockMaterialReturnById
          .mockResolvedValue({
            materialReturn,
            items:
              [],
          });

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a linked Material Issue that is not POSTED',
      async () => {
        transaction
          .lockMaterialIssueById
          .mockResolvedValue({
            materialIssue: {
              ...originalIssue,
              status:
                InventoryMaterialIssueStatus
                  .DRAFT,
            },
            items: [
              originalIssueItem,
            ],
          });

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a return line absent from the original Material Issue',
      async () => {
        transaction
          .lockMaterialIssueById
          .mockResolvedValue({
            materialIssue:
              originalIssue,
            items: [
              {
                ...originalIssueItem,
                itemId:
                  'other-item',
              },
            ],
          });

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a return quantity above the remaining issued quantity',
      async () => {
        transaction
          .getPostedMaterialReturnQuantity
          .mockResolvedValue(4);

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Material Return inside the transaction',
      async () => {
        transaction
          .lockMaterialReturnById
          .mockResolvedValue(null);

        await expect(
          service.postMaterialReturn(
            'missing-material-return',
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'fails closed when the status transition cannot find the Material Return',
      async () => {
        transaction
          .updateMaterialReturnStatus
          .mockResolvedValue(null);

        await expect(
          service.postMaterialReturn(
            materialReturn.id,
            {
              postedByPersonId:
                'founder-person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          transaction.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          eventBus.publish,
        ).not.toHaveBeenCalled();

        expect(
          auditService.record,
        ).not.toHaveBeenCalled();

        expect(
          repository
            .findMaterialReturnById,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
