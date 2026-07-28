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
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryStockTransfer,
  InventoryStockTransferItem,
  InventoryStore,
  InventoryTransferStatus,
} from '../types/inventory.types';

import {
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

import {
  InventoryService,
} from './inventory.service';

import {
  InventoryStockTransferService,
} from './inventory-stock-transfer.service';

describe(
  'InventoryStockTransferService foundation FAT contract',
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
      InventoryStockTransferService;

    const sourceStore:
      InventoryStore = {
        id: 'store-source',
        storeCode: 'SOURCE',
        name: 'Source Store',
        propertyId: 'property-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const destinationStore:
      InventoryStore = {
        id: 'store-destination',
        storeCode: 'DESTINATION',
        name: 'Destination Store',
        propertyId: 'property-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const item:
      InventoryItem = {
        id: 'item-1',
        sku: 'SW-001',
        name: 'Modular Switch',
        categoryId: 'category-1',
        unitOfMeasureId: 'unit-1',
        itemType:
          InventoryItemType.GOODS,
        minimumStockLevel: 0,
        reorderLevel: 0,
        reorderQuantity: 0,
        standardCost: 125,
        currency: 'INR',
        isSerialized: false,
        isBatchTracked: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const sourceBin:
      InventoryBinLocation = {
        id: 'bin-source',
        storeId: sourceStore.id,
        binCode: 'SOURCE-BIN',
        name: 'Source Bin',
        isReceivingBin: false,
        isDispatchBin: true,
        isQuarantineBin: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const destinationBin:
      InventoryBinLocation = {
        id: 'bin-destination',
        storeId: destinationStore.id,
        binCode: 'DESTINATION-BIN',
        name: 'Destination Bin',
        isReceivingBin: true,
        isDispatchBin: false,
        isQuarantineBin: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    beforeEach(() => {
      repository = {
        createTransfer:
          jest.fn(),
        findTransferById:
          jest.fn(),
        listTransfers:
          jest.fn(),
        updateTransferStatus:
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

      const postingMetrics = {
        observe:
          jest.fn(
            async (
              _operation: string,
              work:
                () => Promise<unknown>,
            ) => work(),
          ),
      } as unknown as
        InventoryPostingMetricsService;

      inventoryService
        .getStore
        .mockImplementation(
          async (id: string) =>
            id === sourceStore.id
              ? sourceStore
              : destinationStore,
        );

      inventoryService
        .getItem
        .mockResolvedValue(item);

      inventoryService
        .getBinLocation
        .mockImplementation(
          async (id: string) =>
            id === sourceBin.id
              ? sourceBin
              : destinationBin,
        );

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      service =
        new InventoryStockTransferService(
          repository,
          inventoryService as unknown as
            InventoryService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'creates a normalized draft transfer and records evidence',
      async () => {
        repository.createTransfer
          .mockImplementation(
            async (
              transfer:
                InventoryStockTransfer,
              items:
                InventoryStockTransferItem[],
            ) => ({
              transfer,
              items,
            }),
          );

        const result =
          await service.createTransfer({
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            transferDate:
              '2026-07-28',
            createdByPersonId:
              'founder-person-1',
            remarks:
              ' Founder acceptance transfer ',
            items: [
              {
                itemId:
                  item.id,
                sourceBinLocationId:
                  sourceBin.id,
                destinationBinLocationId:
                  destinationBin.id,
                quantity:
                  5,
                unitCost:
                  125,
                remarks:
                  ' Transfer stock ',
              },
            ],
          });

        expect(result.transfer).toEqual(
          expect.objectContaining({
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            status:
              InventoryTransferStatus.DRAFT,
            createdByPersonId:
              'founder-person-1',
            remarks:
              'Founder acceptance transfer',
          }),
        );

        expect(
          result.transfer.transferNumber,
        ).toMatch(
          /^TRF-20260728-/,
        );

        expect(result.items).toEqual([
          expect.objectContaining({
            itemId:
              item.id,
            sourceBinLocationId:
              sourceBin.id,
            destinationBinLocationId:
              destinationBin.id,
            quantity:
              5,
            dispatchedQuantity:
              0,
            receivedQuantity:
              0,
            unitCost:
              125,
            remarks:
              'Transfer stock',
          }),
        ]);

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_transfer',
            entityId:
              result.transfer.id,
            transferId:
              result.transfer.id,
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            itemCount:
              1,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.created',
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.created',
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'lists transfers using normalized filters',
      async () => {
        repository.listTransfers
          .mockResolvedValue([]);

        await expect(
          service.listTransfers({
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            status:
              ' draft ',
            dateFrom:
              '2026-07-01',
            dateTo:
              '2026-07-31',
          }),
        ).resolves.toEqual([]);

        expect(
          repository.listTransfers,
        ).toHaveBeenCalledWith({
          propertyId:
            'property-1',
          sourceStoreId:
            sourceStore.id,
          destinationStoreId:
            destinationStore.id,
          status:
            InventoryTransferStatus.DRAFT,
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
      'retrieves an existing transfer',
      async () => {
        const details = {
          transfer: {
            id: 'transfer-1',
            transferNumber:
              'TRF-20260728-0001',
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            status:
              InventoryTransferStatus.DRAFT,
            transferDate:
              new Date(
                '2026-07-28',
              ),
            createdByPersonId:
              'founder-person-1',
            metadata: {},
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          },
          items: [],
        };

        repository.findTransferById
          .mockResolvedValue(details);

        await expect(
          service.getTransfer(
            'transfer-1',
          ),
        ).resolves.toEqual(
          details,
        );
      },
    );

    it(
      'cancels a draft transfer and records evidence',
      async () => {
        const draft = {
          id: 'transfer-1',
          transferNumber:
            'TRF-20260728-0001',
          propertyId:
            'property-1',
          sourceStoreId:
            sourceStore.id,
          destinationStoreId:
            destinationStore.id,
          status:
            InventoryTransferStatus.DRAFT,
          transferDate:
            new Date(
              '2026-07-28',
            ),
          createdByPersonId:
            'founder-person-1',
          metadata: {},
          createdAt:
            new Date(),
          updatedAt:
            new Date(),
        };

        repository.findTransferById
          .mockResolvedValueOnce({
            transfer: draft,
            items: [],
          })
          .mockResolvedValueOnce({
            transfer: {
              ...draft,
              status:
                InventoryTransferStatus.CANCELLED,
              cancellationReason:
                'Incorrect destination',
            },
            items: [],
          });

        repository.updateTransferStatus
          .mockResolvedValue({
            ...draft,
            status:
              InventoryTransferStatus.CANCELLED,
            cancellationReason:
              'Incorrect destination',
          });

        const result =
          await service.cancelTransfer(
            draft.id,
            {
              cancelledByPersonId:
                'founder-person-1',
              cancellationReason:
                ' Incorrect destination ',
            },
          );

        expect(
          repository.updateTransferStatus,
        ).toHaveBeenCalledWith(
          draft.id,
          expect.objectContaining({
            status:
              InventoryTransferStatus.CANCELLED,
            cancelledByPersonId:
              'founder-person-1',
            cancellationReason:
              'Incorrect destination',
          }),
        );

        expect(result.transfer.status)
          .toBe(
            InventoryTransferStatus.CANCELLED,
          );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.cancelled',
          'core.inventory',
          expect.objectContaining({
            transferId:
              draft.id,
            cancellationReason:
              'Incorrect destination',
            actorPersonId:
              'founder-person-1',
          }),
        );
      },
    );

    it(
      'rejects a transfer between the same store',
      async () => {
        await expect(
          service.createTransfer({
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              sourceStore.id,
            transferDate:
              '2026-07-28',
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
          repository.createTransfer,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate item and bin combinations',
      async () => {
        await expect(
          service.createTransfer({
            propertyId:
              'property-1',
            sourceStoreId:
              sourceStore.id,
            destinationStoreId:
              destinationStore.id,
            transferDate:
              '2026-07-28',
            createdByPersonId:
              'founder-person-1',
            items: [
              {
                itemId:
                  item.id,
                sourceBinLocationId:
                  sourceBin.id,
                destinationBinLocationId:
                  destinationBin.id,
                quantity:
                  1,
                unitCost:
                  125,
              },
              {
                itemId:
                  item.id,
                sourceBinLocationId:
                  sourceBin.id,
                destinationBinLocationId:
                  destinationBin.id,
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
          repository.createTransfer,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown transfer',
      async () => {
        repository.findTransferById
          .mockResolvedValue(null);

        await expect(
          service.getTransfer(
            'missing-transfer',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
