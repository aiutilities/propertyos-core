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
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryMaterialIssue,
  InventoryMaterialIssueItem,
  InventoryMaterialIssueStatus,
  InventoryStore,
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
  'InventoryMaterialIssueService foundation FAT contract',
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

    let batchAllocationService:
      jest.Mocked<
        Pick<
          InventoryBatchAllocationService,
          'allocate'
        >
      >;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryMaterialIssueService;

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
          'ISSUE-01',
        name:
          'Issue Bin',
        isReceivingBin:
          false,
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
        createMaterialIssue:
          jest.fn(),
        findMaterialIssueById:
          jest.fn(),
        listMaterialIssues:
          jest.fn(),
        updateMaterialIssueStatus:
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

      batchAllocationService = {
        allocate:
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
        new InventoryMaterialIssueService(
          repository,
          inventoryService as unknown as
            InventoryService,
          batchAllocationService as unknown as
            InventoryBatchAllocationService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'creates a normalized draft Material Issue and records evidence',
      async () => {
        repository
          .createMaterialIssue
          .mockImplementation(
            async (
              materialIssue:
                InventoryMaterialIssue,
              items:
                InventoryMaterialIssueItem[],
            ) => ({
              materialIssue,
              items,
            }),
          );

        const result =
          await service
            .createMaterialIssue({
              propertyId:
                store.propertyId,
              storeId:
                store.id,
              issueDate:
                '2026-07-28',
              reasonCode:
                ' maintenance ',
              reasonDescription:
                ' Electrical repair ',
              requestedByPersonId:
                'requester-person-1',
              createdByPersonId:
                'founder-person-1',
              remarks:
                ' Founder acceptance issue ',
              items: [
                {
                  itemId:
                    item.id,
                  binLocationId:
                    bin.id,
                  quantity:
                    5,
                  unitCost:
                    125,
                  remarks:
                    ' Issue switches ',
                },
              ],
            });

        expect(
          result.materialIssue,
        ).toEqual(
          expect.objectContaining({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryMaterialIssueStatus
                .DRAFT,
            reasonCode:
              'MAINTENANCE',
            reasonDescription:
              'Electrical repair',
            requestedByPersonId:
              'requester-person-1',
            createdByPersonId:
              'founder-person-1',
            remarks:
              'Founder acceptance issue',
            metadata:
              {},
          }),
        );

        expect(
          result.materialIssue.issueNumber,
        ).toMatch(
          /^MI-20260728-/,
        );

        expect(result.items).toEqual([
          expect.objectContaining({
            materialIssueId:
              result.materialIssue.id,
            itemId:
              item.id,
            binLocationId:
              bin.id,
            quantity:
              5,
            unitCost:
              125,
            remarks:
              'Issue switches',
            metadata:
              {},
          }),
        ]);

        expect(
          inventoryService.getStore,
        ).toHaveBeenCalledWith(
          store.id,
        );

        expect(
          inventoryService.getItem,
        ).toHaveBeenCalledWith(
          item.id,
        );

        expect(
          inventoryService
            .getBinLocation,
        ).toHaveBeenCalledWith(
          bin.id,
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.material_issue',
            entityId:
              result.materialIssue.id,
            materialIssueId:
              result.materialIssue.id,
            issueNumber:
              result.materialIssue
                .issueNumber,
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            reasonCode:
              'MAINTENANCE',
            itemCount:
              1,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_ISSUE_CREATED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_ISSUE_CREATED,
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'lists Material Issues using normalized filters',
      async () => {
        repository
          .listMaterialIssues
          .mockResolvedValue([]);

        await expect(
          service.listMaterialIssues({
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
          repository
            .listMaterialIssues,
        ).toHaveBeenCalledWith({
          propertyId:
            store.propertyId,
          storeId:
            store.id,
          status:
            InventoryMaterialIssueStatus
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
      'retrieves an existing Material Issue',
      async () => {
        const materialIssue:
          InventoryMaterialIssue = {
            id:
              'material-issue-1',
            issueNumber:
              'MI-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryMaterialIssueStatus
                .DRAFT,
            issueDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'MAINTENANCE',
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
          materialIssue,
          items:
            [],
        };

        repository
          .findMaterialIssueById
          .mockResolvedValue(details);

        await expect(
          service.getMaterialIssue(
            materialIssue.id,
          ),
        ).resolves.toEqual(
          details,
        );
      },
    );

    it(
      'cancels a draft Material Issue and records evidence',
      async () => {
        const draft:
          InventoryMaterialIssue = {
            id:
              'material-issue-1',
            issueNumber:
              'MI-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            status:
              InventoryMaterialIssueStatus
                .DRAFT,
            issueDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'MAINTENANCE',
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
          InventoryMaterialIssue = {
            ...draft,
            status:
              InventoryMaterialIssueStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancelledAt:
              new Date(),
            cancellationReason:
              'Incorrect request',
          };

        repository
          .findMaterialIssueById
          .mockResolvedValueOnce({
            materialIssue:
              draft,
            items:
              [],
          })
          .mockResolvedValueOnce({
            materialIssue:
              cancelled,
            items:
              [],
          });

        repository
          .updateMaterialIssueStatus
          .mockResolvedValue(
            cancelled,
          );

        const result =
          await service
            .cancelMaterialIssue(
              draft.id,
              {
                cancelledByPersonId:
                  'founder-person-2',
                cancellationReason:
                  ' Incorrect request ',
              },
            );

        expect(
          repository
            .updateMaterialIssueStatus,
        ).toHaveBeenCalledWith(
          draft.id,
          expect.objectContaining({
            status:
              InventoryMaterialIssueStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancellationReason:
              'Incorrect request',
          }),
        );

        expect(
          result.materialIssue.status,
        ).toBe(
          InventoryMaterialIssueStatus
            .CANCELLED,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_ISSUE_CANCELLED,
          'core.inventory',
          expect.objectContaining({
            materialIssueId:
              draft.id,
            cancellationReason:
              'Incorrect request',
            actorPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'rejects an inactive Inventory store',
      async () => {
        inventoryService
          .getStore
          .mockResolvedValue({
            ...store,
            isActive:
              false,
          });

        await expect(
          service.createMaterialIssue({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            issueDate:
              '2026-07-28',
            reasonCode:
              'MAINTENANCE',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                quantity:
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
          repository
            .createMaterialIssue,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate item, bin, and Batch combinations',
      async () => {
        await expect(
          service.createMaterialIssue({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            issueDate:
              '2026-07-28',
            reasonCode:
              'MAINTENANCE',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                binLocationId:
                  bin.id,
                quantity:
                  1,
                unitCost:
                  125,
              },
              {
                itemId:
                  item.id,
                binLocationId:
                  bin.id,
                quantity:
                  2,
                unitCost:
                  125,
              },
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .createMaterialIssue,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Material Issue',
      async () => {
        repository
          .findMaterialIssueById
          .mockResolvedValue(null);

        await expect(
          service.getMaterialIssue(
            'missing-material-issue',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
