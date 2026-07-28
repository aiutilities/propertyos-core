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
  InventoryMaterialReturn,
  InventoryMaterialReturnItem,
  InventoryMaterialReturnStatus,
  InventoryStore,
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
  'InventoryMaterialReturnService foundation FAT contract',
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

    let batchService:
      jest.Mocked<
        Pick<
          InventoryBatchService,
          'getByIds'
        >
      >;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryMaterialReturnService;

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
          'RETURN-01',
        name:
          'Return Bin',
        isReceivingBin:
          true,
        isDispatchBin:
          false,
        isQuarantineBin:
          false,
        isActive:
          true,
        createdAt:
          new Date(),
        updatedAt:
          new Date(),
      };

    const originalIssue:
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
            .POSTED,
        issueDate:
          new Date(
            '2026-07-27',
          ),
        reasonCode:
          'MAINTENANCE',
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
          item.id,
        binLocationId:
          bin.id,
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

    beforeEach(() => {
      repository = {
        createMaterialReturn:
          jest.fn(),
        findMaterialReturnById:
          jest.fn(),
        listMaterialReturns:
          jest.fn(),
        updateMaterialReturnStatus:
          jest.fn(),
        findMaterialIssueById:
          jest.fn(),
        getPostedMaterialReturnQuantity:
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

      batchService = {
        getByIds:
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

      repository
        .findMaterialIssueById
        .mockResolvedValue({
          materialIssue:
            originalIssue,
          items: [
            originalIssueItem,
          ],
        });

      repository
        .getPostedMaterialReturnQuantity
        .mockResolvedValue(0);

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
        new InventoryMaterialReturnService(
          repository,
          inventoryService as unknown as
            InventoryService,
          batchService as unknown as
            InventoryBatchService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'creates a normalized draft Material Return linked to a posted issue',
      async () => {
        repository
          .createMaterialReturn
          .mockImplementation(
            async (
              materialReturn:
                InventoryMaterialReturn,
              items:
                InventoryMaterialReturnItem[],
            ) => ({
              materialReturn,
              items,
            }),
          );

        const result =
          await service
            .createMaterialReturn({
              propertyId:
                store.propertyId,
              storeId:
                store.id,
              materialIssueId:
                originalIssue.id,
              returnDate:
                '2026-07-28',
              reasonCode:
                ' unused ',
              reasonDescription:
                ' Unused maintenance stock ',
              returnedByPersonId:
                'technician-person-1',
              createdByPersonId:
                'founder-person-1',
              remarks:
                ' Founder acceptance return ',
              items: [
                {
                  itemId:
                    item.id,
                  binLocationId:
                    bin.id,
                  quantity:
                    2,
                  unitCost:
                    125,
                  remarks:
                    ' Return switches ',
                },
              ],
            });

        expect(
          result.materialReturn,
        ).toEqual(
          expect.objectContaining({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
            status:
              InventoryMaterialReturnStatus
                .DRAFT,
            reasonCode:
              'UNUSED',
            reasonDescription:
              'Unused maintenance stock',
            returnedByPersonId:
              'technician-person-1',
            createdByPersonId:
              'founder-person-1',
            remarks:
              'Founder acceptance return',
            metadata:
              {},
          }),
        );

        expect(
          result.materialReturn.returnNumber,
        ).toMatch(
          /^MR-20260728-/,
        );

        expect(result.items).toEqual([
          expect.objectContaining({
            materialReturnId:
              result.materialReturn.id,
            itemId:
              item.id,
            binLocationId:
              bin.id,
            quantity:
              2,
            unitCost:
              125,
            remarks:
              'Return switches',
            metadata:
              {},
          }),
        ]);

        expect(
          repository
            .getPostedMaterialReturnQuantity,
        ).toHaveBeenCalledWith(
          originalIssue.id,
          item.id,
          bin.id,
          undefined,
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.material_return',
            entityId:
              result.materialReturn.id,
            materialReturnId:
              result.materialReturn.id,
            returnNumber:
              result.materialReturn
                .returnNumber,
            materialIssueId:
              originalIssue.id,
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            reasonCode:
              'UNUSED',
            itemCount:
              1,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_RETURN_CREATED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_RETURN_CREATED,
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'lists Material Returns using normalized filters',
      async () => {
        repository
          .listMaterialReturns
          .mockResolvedValue([]);

        await expect(
          service.listMaterialReturns({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
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
            .listMaterialReturns,
        ).toHaveBeenCalledWith({
          propertyId:
            store.propertyId,
          storeId:
            store.id,
          materialIssueId:
            originalIssue.id,
          status:
            InventoryMaterialReturnStatus
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
      'retrieves an existing Material Return',
      async () => {
        const materialReturn:
          InventoryMaterialReturn = {
            id:
              'material-return-1',
            returnNumber:
              'MR-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
            status:
              InventoryMaterialReturnStatus
                .DRAFT,
            returnDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'UNUSED',
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
          materialReturn,
          items:
            [],
        };

        repository
          .findMaterialReturnById
          .mockResolvedValue(details);

        await expect(
          service.getMaterialReturn(
            materialReturn.id,
          ),
        ).resolves.toEqual(
          details,
        );
      },
    );

    it(
      'cancels a draft Material Return and records evidence',
      async () => {
        const draft:
          InventoryMaterialReturn = {
            id:
              'material-return-1',
            returnNumber:
              'MR-20260728-0001',
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
            status:
              InventoryMaterialReturnStatus
                .DRAFT,
            returnDate:
              new Date(
                '2026-07-28',
              ),
            reasonCode:
              'UNUSED',
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
          InventoryMaterialReturn = {
            ...draft,
            status:
              InventoryMaterialReturnStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancelledAt:
              new Date(),
            cancellationReason:
              'Incorrect return',
          };

        repository
          .findMaterialReturnById
          .mockResolvedValueOnce({
            materialReturn:
              draft,
            items:
              [],
          })
          .mockResolvedValueOnce({
            materialReturn:
              cancelled,
            items:
              [],
          });

        repository
          .updateMaterialReturnStatus
          .mockResolvedValue(
            cancelled,
          );

        const result =
          await service
            .cancelMaterialReturn(
              draft.id,
              {
                cancelledByPersonId:
                  'founder-person-2',
                cancellationReason:
                  ' Incorrect return ',
              },
            );

        expect(
          repository
            .updateMaterialReturnStatus,
        ).toHaveBeenCalledWith(
          draft.id,
          expect.objectContaining({
            status:
              InventoryMaterialReturnStatus
                .CANCELLED,
            cancelledByPersonId:
              'founder-person-2',
            cancellationReason:
              'Incorrect return',
          }),
        );

        expect(
          result.materialReturn.status,
        ).toBe(
          InventoryMaterialReturnStatus
            .CANCELLED,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .MATERIAL_RETURN_CANCELLED,
          'core.inventory',
          expect.objectContaining({
            materialReturnId:
              draft.id,
            materialIssueId:
              originalIssue.id,
            cancellationReason:
              'Incorrect return',
            actorPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'rejects a return linked to a non-posted Material Issue',
      async () => {
        repository
          .findMaterialIssueById
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
          service.createMaterialReturn({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
            returnDate:
              '2026-07-28',
            reasonCode:
              'UNUSED',
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
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .createMaterialReturn,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a return quantity above the remaining issued quantity',
      async () => {
        repository
          .getPostedMaterialReturnQuantity
          .mockResolvedValue(4);

        await expect(
          service.createMaterialReturn({
            propertyId:
              store.propertyId,
            storeId:
              store.id,
            materialIssueId:
              originalIssue.id,
            returnDate:
              '2026-07-28',
            reasonCode:
              'UNUSED',
            createdByPersonId:
              'founder-person-1',
            items: [
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
            .createMaterialReturn,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Material Return',
      async () => {
        repository
          .findMaterialReturnById
          .mockResolvedValue(null);

        await expect(
          service.getMaterialReturn(
            'missing-material-return',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
