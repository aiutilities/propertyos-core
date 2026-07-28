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
  'InventoryStockTransferService dispatch FAT contract',
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

    const transferDate =
      new Date(
        '2026-07-28T00:00:00.000Z',
      );

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
          InventoryTransferStatus.DRAFT,
        transferDate,
        createdByPersonId:
          'founder-person-1',
        remarks:
          'Founder dispatch',
        metadata: {},
        createdAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-28T00:00:00.000Z',
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
          0,
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
            '2026-07-28T00:00:00.000Z',
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
            dispatchedByPersonId:
              input.dispatchedByPersonId,
            dispatchedAt:
              input.dispatchedAt,
            updatedAt:
              input.updatedAt,
          }),
        );

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      const inventoryService =
        {} as InventoryService;

      service =
        new InventoryStockTransferService(
          repository,
          inventoryService,
          eventBus,
          auditService,
          postingMetrics,
        );
    });

    it(
      'dispatches a transfer through an idempotent TRANSFER_OUT movement',
      async () => {
        const dispatchedItem = {
          ...baseItem,
          dispatchedQuantity:
            5,
        };

        const dispatchedTransfer = {
          ...baseTransfer,
          status:
            InventoryTransferStatus
              .DISPATCHED,
          dispatchedByPersonId:
            'founder-person-2',
          dispatchedAt:
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
              dispatchedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              dispatchedTransfer,
              dispatchedItem,
            ),
          );

        const result =
          await service.dispatchTransfer(
            baseTransfer.id,
            {
              dispatchedByPersonId:
                'founder-person-2',
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
          'transfer_dispatch',
          expect.any(Function),
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType
              .TRANSFER_OUT,
          itemId:
            baseItem.itemId,
          storeId:
            baseTransfer.sourceStoreId,
          binLocationId:
            baseItem.sourceBinLocationId,
          quantityDelta:
            -5,
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
            'inventory-transfer:dispatch:transfer-1:transfer-item-1:5',
          correlationId:
            baseTransfer.id,
          movementDate:
            transferDate,
          postedByPersonId:
            'founder-person-2',
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
            dispatchedTarget:
              5,
            dispatchedDelta:
              5,
          },
        });

        expect(
          repository
            .updateTransferItemQuantities,
        ).toHaveBeenCalledWith(
          baseItem.id,
          expect.objectContaining({
            dispatchedQuantity:
              5,
            receivedQuantity:
              0,
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
                .DISPATCHED,
            dispatchedByPersonId:
              'founder-person-2',
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
            actorPersonId:
              'founder-person-2',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.dispatched',
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          'inventory.stock.transfer.dispatched',
          'core.inventory',
          evidence,
        );

        expect(
          result.transfer.status,
        ).toBe(
          InventoryTransferStatus
            .DISPATCHED,
        );
      },
    );

    it(
      'posts only the incremental dispatch quantity',
      async () => {
        const partiallyDispatched = {
          ...baseItem,
          dispatchedQuantity:
            2,
        };

        const targetDispatched = {
          ...baseItem,
          dispatchedQuantity:
            5,
        };

        const alreadyDispatchedTransfer = {
          ...baseTransfer,
          status:
            InventoryTransferStatus
              .DISPATCHED,
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              alreadyDispatchedTransfer,
              partiallyDispatched,
            ),
          )
          .mockResolvedValueOnce(
            details(
              alreadyDispatchedTransfer,
              targetDispatched,
            ),
          )
          .mockResolvedValueOnce(
            details(
              alreadyDispatchedTransfer,
              targetDispatched,
            ),
          );

        await service.dispatchTransfer(
          baseTransfer.id,
          {
            dispatchedByPersonId:
              'founder-person-2',
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
              -3,
            idempotencyKey:
              'inventory-transfer:dispatch:transfer-1:transfer-item-1:5',
            metadata:
              expect.objectContaining({
                dispatchedTarget:
                  5,
                dispatchedDelta:
                  3,
              }),
          }),
        );
      },
    );

    it(
      'does not post another movement when the target is already dispatched',
      async () => {
        const dispatchedItem = {
          ...baseItem,
          dispatchedQuantity:
            5,
        };

        const dispatchedTransfer = {
          ...baseTransfer,
          status:
            InventoryTransferStatus
              .DISPATCHED,
        };

        repository.findTransferById
          .mockResolvedValueOnce(
            details(
              dispatchedTransfer,
              dispatchedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              dispatchedTransfer,
              dispatchedItem,
            ),
          )
          .mockResolvedValueOnce(
            details(
              dispatchedTransfer,
              dispatchedItem,
            ),
          );

        await service.dispatchTransfer(
          baseTransfer.id,
          {
            dispatchedByPersonId:
              'founder-person-2',
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

        expect(
          repository
            .updateTransferStatus,
        ).toHaveBeenCalledWith(
          baseTransfer.id,
          expect.objectContaining({
            status:
              InventoryTransferStatus
                .DISPATCHED,
          }),
        );
      },
    );

    it(
      'rejects dispatching a transfer from an invalid status',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details({
              ...baseTransfer,
              status:
                InventoryTransferStatus
                  .RECEIVED,
            }),
          );

        await expect(
          service.dispatchTransfer(
            baseTransfer.id,
            {
              dispatchedByPersonId:
                'founder-person-2',
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
      'rejects a dispatch target above the transfer quantity',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              baseItem,
            ),
          );

        await expect(
          service.dispatchTransfer(
            baseTransfer.id,
            {
              dispatchedByPersonId:
                'founder-person-2',
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
          service.dispatchTransfer(
            baseTransfer.id,
            {
              dispatchedByPersonId:
                'founder-person-2',
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
      'rejects duplicate dispatch targets',
      async () => {
        repository.findTransferById
          .mockResolvedValue(
            details(
              baseTransfer,
              baseItem,
            ),
          );

        await expect(
          service.dispatchTransfer(
            baseTransfer.id,
            {
              dispatchedByPersonId:
                'founder-person-2',
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
