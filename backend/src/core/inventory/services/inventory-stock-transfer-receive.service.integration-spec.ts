import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
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
  InventoryStockMovementType,
  InventoryStockTransfer,
  InventoryStockTransferItem,
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
  'InventoryStockTransferService receive FAT contract',
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
      InventoryStockTransferService;

    const baseTransfer:
      InventoryStockTransfer = {
        id:
          'transfer-1',
        transferNumber:
          'TRF-20260728-0001',
        propertyId:
          'property-1',
        sourceStoreId:
          'store-source',
        destinationStoreId:
          'store-destination',
        status:
          InventoryTransferStatus
            .DISPATCHED,
        transferDate:
          new Date(
            '2026-07-28T00:00:00.000Z',
          ),
        createdByPersonId:
          'founder-person-1',
        dispatchedByPersonId:
          'founder-person-2',
        dispatchedAt:
          new Date(
            '2026-07-28T01:00:00.000Z',
          ),
        remarks:
          'Founder transfer',
        metadata: {},
        createdAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-28T01:00:00.000Z',
          ),
      };

    const baseItem:
      InventoryStockTransferItem = {
        id:
          'transfer-item-1',
        transferId:
          baseTransfer.id,
        itemId:
          'item-1',
        sourceBinLocationId:
          'bin-source',
        destinationBinLocationId:
          'bin-destination',
        quantity:
          5,
        dispatchedQuantity:
          5,
        receivedQuantity:
          0,
        unitCost:
          125,
        remarks:
          'Move switches',
        createdAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
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

    const details = (
      transfer:
        InventoryStockTransfer,
      item:
        InventoryStockTransferItem =
          baseItem,
    ) => ({
      transfer,
      items: [
        item,
      ],
    });

    beforeEach(() => {
      repository = {
        findTransferById:
          jest.fn(),
        postMovement:
          jest.fn(),
        updateTransferItemQuantities:
          jest.fn(),
        updateTransferStatus:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

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

      repository.postMovement
        .mockResolvedValue(
          movementResult,
        );

      repository
        .updateTransferItemQuantities
        .mockImplementation(
          async (
            _id,
            input,
          ) => ({
            ...baseItem,
            dispatchedQuantity:
              input.dispatchedQuantity,
            receivedQuantity:
              input.receivedQuantity,
            updatedAt:
              input.updatedAt,
          }),
        );

      repository
        .updateTransferStatus
        .mockImplementation(
          async (
            _id,
            input,
          ) => ({
            ...baseTransfer,
            status:
              input.status,
            receivedByPersonId:
              input.receivedByPersonId,
            receivedAt:
              input.receivedAt,
            updatedAt:
              input.updatedAt,
          }),
        );

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      service =
        new InventoryStockTransferService(
          repository,
          {} as InventoryService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'receives a dispatched transfer through an idempotent TRANSFER_IN movement',
      async () => {
        const receivedItem = {
          ...baseItem,
          receivedQuantity:
            5,
        };

        const receivedTransfer = {
          ...baseTransfer,
          status:
            InventoryTransferStatus
              .RECEIVED,
          receivedByPersonId:
            'founder-person-3',
          receivedAt:
            new Date(),
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              baseItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              receivedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              receivedTransfer,
              receivedItem,
            ),
          );

        const result =
          await service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    5,
                },
              ],
            },
          );

        expect(
          postingMetrics.observe,
        ).toHaveBeenCalledWith(
          'transfer_receive',
          expect.any(Function),
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .TRANSFER_IN,
            itemId:
              baseItem.itemId,
            storeId:
              baseTransfer
                .destinationStoreId,
            binLocationId:
              baseItem
                .destinationBinLocationId,
            quantityDelta:
              5,
            unitCost:
              baseItem.unitCost,
            sourceType:
              'inventory.stock_transfer',
            sourceId:
              baseTransfer.id,
            sourceLineId:
              baseItem.id,
            referenceNumber:
              baseTransfer.transferNumber,
            idempotencyKey:
              'inventory-transfer:receive:transfer-1:transfer-item-1:5',
            correlationId:
              baseTransfer.id,
            postedByPersonId:
              'founder-person-3',
            remarks:
              baseItem.remarks,
            metadata: {
              transferId:
                baseTransfer.id,
              transferNumber:
                baseTransfer.transferNumber,
              propertyId:
                baseTransfer.propertyId,
              sourceStoreId:
                baseTransfer.sourceStoreId,
              destinationStoreId:
                baseTransfer
                  .destinationStoreId,
              transferItemId:
                baseItem.id,
              receivedTarget:
                5,
              receivedDelta:
                5,
            },
          }),
        );

        expect(
          repository
            .updateTransferItemQuantities,
        ).toHaveBeenCalledWith(
          baseItem.id,
          expect.objectContaining({
            dispatchedQuantity:
              5,
            receivedQuantity:
              5,
          }),
        );

        expect(
          repository
            .updateTransferStatus,
        ).toHaveBeenCalledWith(
          baseTransfer.id,
          expect.objectContaining({
            status:
              InventoryTransferStatus
                .RECEIVED,
            receivedByPersonId:
              'founder-person-3',
            receivedAt:
              expect.any(Date),
          }),
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_transfer',
            entityId:
              baseTransfer.id,
            transferId:
              baseTransfer.id,
            transferNumber:
              baseTransfer.transferNumber,
            propertyId:
              baseTransfer.propertyId,
            sourceStoreId:
              baseTransfer.sourceStoreId,
            destinationStoreId:
              baseTransfer
                .destinationStoreId,
            completed:
              true,
            actorPersonId:
              'founder-person-3',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .STOCK_TRANSFERRED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS
            .STOCK_TRANSFERRED,
          'core.inventory',
          evidence,
        );

        expect(
          result.transfer.status,
        ).toBe(
          InventoryTransferStatus
            .RECEIVED,
        );
      },
    );

    it(
      'posts only the incremental received quantity',
      async () => {
        const partiallyReceived = {
          ...baseItem,
          receivedQuantity:
            2,
        };

        const targetReceived = {
          ...baseItem,
          receivedQuantity:
            5,
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              partiallyReceived,
            ),
          )
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              targetReceived,
            ),
          )
          .mockResolvedValueOnce(
            details(
              {
                ...baseTransfer,
                status:
                  InventoryTransferStatus
                    .RECEIVED,
              },
              targetReceived,
            ),
          );

        await service.receiveTransfer(
          baseTransfer.id,
          {
            receivedByPersonId:
              'founder-person-3',
            items: [
              {
                transferItemId:
                  baseItem.id,
                quantity:
                  5,
              },
            ],
          },
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            quantityDelta:
              3,
            idempotencyKey:
              'inventory-transfer:receive:transfer-1:transfer-item-1:5',
            metadata:
              expect.objectContaining({
                receivedTarget:
                  5,
                receivedDelta:
                  3,
              }),
          }),
        );
      },
    );

    it(
      'keeps the transfer dispatched after partial receipt',
      async () => {
        const partiallyReceived = {
          ...baseItem,
          receivedQuantity:
            3,
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              baseItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              partiallyReceived,
            ),
          )
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              partiallyReceived,
            ),
          );

        await service.receiveTransfer(
          baseTransfer.id,
          {
            receivedByPersonId:
              'founder-person-3',
            items: [
              {
                transferItemId:
                  baseItem.id,
                quantity:
                  3,
              },
            ],
          },
        );

        expect(
          repository
            .updateTransferStatus,
        ).toHaveBeenCalledWith(
          baseTransfer.id,
          expect.objectContaining({
            status:
              InventoryTransferStatus
                .DISPATCHED,
            receivedByPersonId:
              'founder-person-3',
            receivedAt:
              undefined,
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.partially_received',
          'core.inventory',
          expect.objectContaining({
            transferId:
              baseTransfer.id,
            completed:
              false,
          }),
        );
      },
    );

    it(
      'does not post another movement when the receipt target is already reached',
      async () => {
        const receivedItem = {
          ...baseItem,
          receivedQuantity:
            5,
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              receivedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              baseTransfer,
              receivedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              {
                ...baseTransfer,
                status:
                  InventoryTransferStatus
                    .RECEIVED,
              },
              receivedItem,
            ),
          );

        await service.receiveTransfer(
          baseTransfer.id,
          {
            receivedByPersonId:
              'founder-person-3',
            items: [
              {
                transferItemId:
                  baseItem.id,
                quantity:
                  5,
              },
            ],
          },
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();

        expect(
          repository
            .updateTransferItemQuantities,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects receiving a transfer outside DISPATCHED status',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details({
              ...baseTransfer,
              status:
                InventoryTransferStatus
                  .DRAFT,
            }),
          );

        await expect(
          service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    5,
                },
              ],
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
      'rejects receiving more than the dispatched quantity',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              baseItem,
            ),
          );

        await expect(
          service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    6,
                },
              ],
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
      'rejects lowering the previously received target',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              {
                ...baseItem,
                receivedQuantity:
                  3,
              },
            ),
          );

        await expect(
          service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    2,
                },
              ],
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
      'rejects a foreign transfer item',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              baseItem,
            ),
          );

        await expect(
          service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    'foreign-item',
                  quantity:
                    1,
                },
              ],
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
      'rejects duplicate receipt targets',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              baseItem,
            ),
          );

        await expect(
          service.receiveTransfer(
            baseTransfer.id,
            {
              receivedByPersonId:
                'founder-person-3',
              items: [
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    2,
                },
                {
                  transferItemId:
                    baseItem.id,
                  quantity:
                    3,
                },
              ],
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
  },
);
