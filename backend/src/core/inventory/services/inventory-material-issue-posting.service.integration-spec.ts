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
  InventoryStockMovementType,
} from '../types/inventory.types';

import {
  InventoryBatchAllocationService,
} from './inventory-batch-allocation.service';

import {
  InventoryMaterialIssueService,
} from './inventory-material-issue.service';

import {
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryMaterialIssueService posting FAT contract',
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
      InventoryMaterialIssueService;

    const issueDate =
      new Date(
        '2026-07-28T00:00:00.000Z',
      );

    const materialIssue:
      InventoryMaterialIssue = {
        id:
          'material-issue-1',
        issueNumber:
          'MI-20260728-0001',
        propertyId:
          'property-1',
        storeId:
          'store-1',
        status:
          InventoryMaterialIssueStatus
            .DRAFT,
        issueDate,
        reasonCode:
          'MAINTENANCE',
        reasonDescription:
          'Electrical repair',
        requestedByPersonId:
          'requester-person-1',
        createdByPersonId:
          'founder-person-1',
        remarks:
          'Maintenance consumption',
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

    const firstItem:
      InventoryMaterialIssueItem = {
        id:
          'material-issue-item-1',
        materialIssueId:
          materialIssue.id,
        itemId:
          'item-1',
        binLocationId:
          'bin-1',
        quantity:
          5,
        unitCost:
          125,
        remarks:
          'Issue switches',
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const secondItem:
      InventoryMaterialIssueItem = {
        id:
          'material-issue-item-2',
        materialIssueId:
          materialIssue.id,
        itemId:
          'item-2',
        binLocationId:
          'bin-2',
        batchId:
          'batch-1',
        quantity:
          2,
        unitCost:
          300,
        metadata:
          {},
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const postedIssue:
      InventoryMaterialIssue = {
        ...materialIssue,
        status:
          InventoryMaterialIssueStatus
            .POSTED,
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
      transaction = {
        lockMaterialIssueById:
          jest.fn(),
        postMovement:
          jest.fn(),
        updateMaterialIssueStatus:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerTransaction>;

      repository = {
        withTransaction:
          jest.fn(),
        findMaterialIssueById:
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
        .lockMaterialIssueById
        .mockResolvedValue({
          materialIssue,
          items: [
            firstItem,
            secondItem,
          ],
        });

      transaction.postMovement
        .mockResolvedValue(
          movementResult,
        );

      transaction
        .updateMaterialIssueStatus
        .mockResolvedValue(
          postedIssue,
        );

      repository
        .findMaterialIssueById
        .mockResolvedValue({
          materialIssue:
            postedIssue,
          items: [
            firstItem,
            secondItem,
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
        new InventoryMaterialIssueService(
          repository,
          {} as InventoryService,
          {} as InventoryBatchAllocationService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'posts every Material Issue line as an idempotent ISSUE movement',
      async () => {
        const result =
          await service
            .postMaterialIssue(
              materialIssue.id,
              {
                postedByPersonId:
                  'founder-person-2',
              },
            );

        expect(
          postingMetrics.observe,
        ).toHaveBeenCalledWith(
          'material_issue',
          expect.any(Function),
        );

        expect(
          repository.withTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          transaction
            .lockMaterialIssueById,
        ).toHaveBeenCalledWith(
          materialIssue.id,
        );

        expect(
          transaction.postMovement,
        ).toHaveBeenCalledTimes(2);

        expect(
          transaction.postMovement,
        ).toHaveBeenNthCalledWith(
          1,
          {
            movementType:
              InventoryStockMovementType
                .ISSUE,
            itemId:
              firstItem.itemId,
            storeId:
              materialIssue.storeId,
            binLocationId:
              firstItem.binLocationId,
            batchId:
              undefined,
            quantityDelta:
              -5,
            unitCost:
              125,
            sourceType:
              'inventory.material_issue',
            sourceId:
              materialIssue.id,
            sourceLineId:
              firstItem.id,
            referenceNumber:
              materialIssue.issueNumber,
            idempotencyKey:
              'inventory-material-issue:material-issue-1:material-issue-item-1',
            correlationId:
              materialIssue.id,
            movementDate:
              issueDate,
            postedByPersonId:
              'founder-person-2',
            remarks:
              firstItem.remarks,
            metadata: {
              materialIssueId:
                materialIssue.id,
              issueNumber:
                materialIssue.issueNumber,
              propertyId:
                materialIssue.propertyId,
              storeId:
                materialIssue.storeId,
              reasonCode:
                materialIssue.reasonCode,
              reasonDescription:
                materialIssue
                  .reasonDescription,
              materialIssueItemId:
                firstItem.id,
              batchId:
                undefined,
              requestedByPersonId:
                materialIssue
                  .requestedByPersonId,
            },
          },
        );

        expect(
          transaction.postMovement,
        ).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .ISSUE,
            itemId:
              secondItem.itemId,
            binLocationId:
              secondItem.binLocationId,
            batchId:
              secondItem.batchId,
            quantityDelta:
              -2,
            idempotencyKey:
              'inventory-material-issue:material-issue-1:material-issue-item-2',
            correlationId:
              materialIssue.id,
            remarks:
              materialIssue.remarks,
            metadata:
              expect.objectContaining({
                materialIssueItemId:
                  secondItem.id,
                batchId:
                  secondItem.batchId,
              }),
          }),
        );

        expect(
          transaction
            .updateMaterialIssueStatus,
        ).toHaveBeenCalledWith(
          materialIssue.id,
          expect.objectContaining({
            status:
              InventoryMaterialIssueStatus
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
          result.materialIssue.status,
        ).toBe(
          InventoryMaterialIssueStatus
            .POSTED,
        );
      },
    );

    it(
      'records Material Issue posting event and audit evidence',
      async () => {
        await service.postMaterialIssue(
          materialIssue.id,
          {
            postedByPersonId:
              'founder-person-2',
          },
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.material_issue',
            entityId:
              materialIssue.id,
            materialIssueId:
              materialIssue.id,
            issueNumber:
              materialIssue.issueNumber,
            propertyId:
              materialIssue.propertyId,
            storeId:
              materialIssue.storeId,
            reasonCode:
              materialIssue.reasonCode,
            itemCount:
              2,
            actorPersonId:
              'founder-person-2',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_ISSUE_POSTED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_ISSUE_POSTED,
          'core.inventory',
          evidence,
        );

        expect(
          repository
            .findMaterialIssueById,
        ).toHaveBeenCalledWith(
          materialIssue.id,
        );
      },
    );

    it(
      'rejects posting a Material Issue outside DRAFT status',
      async () => {
        transaction
          .lockMaterialIssueById
          .mockResolvedValue({
            materialIssue: {
              ...materialIssue,
              status:
                InventoryMaterialIssueStatus
                  .POSTED,
            },
            items: [
              firstItem,
            ],
          });

        await expect(
          service.postMaterialIssue(
            materialIssue.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          transaction.postMovement,
        ).not.toHaveBeenCalled();

        expect(
          transaction
            .updateMaterialIssueStatus,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects posting a Material Issue with no items',
      async () => {
        transaction
          .lockMaterialIssueById
          .mockResolvedValue({
            materialIssue,
            items:
              [],
          });

        await expect(
          service.postMaterialIssue(
            materialIssue.id,
            {
              postedByPersonId:
                'founder-person-2',
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
      'rejects an unknown Material Issue inside the transaction',
      async () => {
        transaction
          .lockMaterialIssueById
          .mockResolvedValue(null);

        await expect(
          service.postMaterialIssue(
            'missing-material-issue',
            {
              postedByPersonId:
                'founder-person-2',
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
      'fails closed when the status transition cannot find the Material Issue',
      async () => {
        transaction
          .updateMaterialIssueStatus
          .mockResolvedValue(null);

        await expect(
          service.postMaterialIssue(
            materialIssue.id,
            {
              postedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          transaction.postMovement,
        ).toHaveBeenCalledTimes(2);

        expect(
          eventBus.publish,
        ).not.toHaveBeenCalled();

        expect(
          auditService.record,
        ).not.toHaveBeenCalled();

        expect(
          repository
            .findMaterialIssueById,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
