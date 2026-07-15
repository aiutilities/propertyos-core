import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryStockTransferService,
} from '../../src/core/inventory/services/inventory-stock-transfer.service';

import {
  InventoryStockMovementType,
  InventoryTransferStatus,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Stock Transfer workflow',
  () => {
    const propertyId =
      '11111111-1111-4111-8111-111111111111';

    const sourceStoreId =
      '22222222-2222-4222-8222-222222222222';

    const destinationStoreId =
      '33333333-3333-4333-8333-333333333333';

    const itemId =
      '44444444-4444-4444-8444-444444444444';

    const sourceBinId =
      '55555555-5555-4555-8555-555555555555';

    const destinationBinId =
      '66666666-6666-4666-8666-666666666666';

    const actorId =
      '77777777-7777-4777-8777-777777777777';

    let transferDetails:
      any;

    let stockLedgerRepository:
      any;

    let inventoryService:
      any;

    let eventBus:
      any;

    let auditService:
      any;

    let service:
      InventoryStockTransferService;

    beforeEach(
      () => {
        transferDetails =
          undefined;

        inventoryService = {
          getStore:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                propertyId,
                isActive:
                  true,
              }),
            ),

          getItem:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                isActive:
                  true,
              }),
            ),

          getBinLocation:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                storeId:
                  id === sourceBinId
                    ? sourceStoreId
                    : destinationStoreId,

                isActive:
                  true,
              }),
            ),
        };

        stockLedgerRepository = {
          createTransfer:
            jest.fn(
              async (
                transfer: any,
                items: any[],
              ) => {
                transferDetails = {
                  transfer: {
                    ...transfer,
                  },

                  items:
                    items.map(
                      (item) => ({
                        ...item,
                      }),
                    ),
                };

                return transferDetails;
              },
            ),

          findTransferById:
            jest.fn(
              async () =>
                transferDetails,
            ),

          listTransfers:
            jest.fn(
              async () =>
                transferDetails
                  ? [
                      transferDetails
                        .transfer,
                    ]
                  : [],
            ),

          postMovement:
            jest.fn(
              async (
                input: any,
              ) => ({
                entry: {
                  id:
                    `ledger-${stockLedgerRepository.postMovement.mock.calls.length}`,

                  movementType:
                    input.movementType,

                  quantityDelta:
                    input.quantityDelta,

                  idempotencyKey:
                    input.idempotencyKey,
                },

                balance: {
                  itemId:
                    input.itemId,

                  storeId:
                    input.storeId,
                },

                idempotentReplay:
                  false,
              }),
            ),

          updateTransferItemQuantities:
            jest.fn(
              async (
                transferItemId:
                  string,

                input: any,
              ) => {
                const item =
                  transferDetails
                    .items
                    .find(
                      (
                        candidate:
                          any,
                      ) =>
                        candidate.id ===
                        transferItemId,
                    );

                if (!item) {
                  return null;
                }

                Object.assign(
                  item,
                  input,
                );

                return {
                  ...item,
                };
              },
            ),

          updateTransferStatus:
            jest.fn(
              async (
                transferId:
                  string,

                input: any,
              ) => {
                if (
                  !transferDetails ||
                  transferDetails
                    .transfer
                    .id !==
                    transferId
                ) {
                  return null;
                }

                for (
                  const [
                    key,
                    value,
                  ]
                  of Object.entries(
                    input,
                  )
                ) {
                  if (
                    value !==
                    undefined
                  ) {
                    transferDetails
                      .transfer[
                        key
                      ] =
                      value;
                  }
                }

                return {
                  ...transferDetails
                    .transfer,
                };
              },
            ),
        };

        eventBus = {
          publish:
            jest.fn(
              async () =>
                undefined,
            ),
        };

        auditService = {
          record:
            jest.fn(
              async () =>
                undefined,
            ),
        };

        service =
          new InventoryStockTransferService(
            stockLedgerRepository,
            inventoryService,
            eventBus,
            auditService,
          );
      },
    );

    const createTransfer =
      async (
        quantity = 10,
      ) => {
        const created =
          await service
            .createTransfer({
              propertyId,

              sourceStoreId,

              destinationStoreId,

              transferDate:
                '2026-07-15',

              createdByPersonId:
                actorId,

              remarks:
                'Transfer test',

              items: [
                {
                  itemId,

                  sourceBinLocationId:
                    sourceBinId,

                  destinationBinLocationId:
                    destinationBinId,

                  quantity,

                  unitCost:
                    25,

                  remarks:
                    'Transfer line',
                },
              ],
            });

        return created;
      };

    it(
      'creates a DRAFT transfer with validated stores, bins, and items',
      async () => {
        const created =
          await createTransfer();

        expect(
          created.transfer.status,
        ).toBe(
          InventoryTransferStatus
            .DRAFT,
        );

        expect(
          created.transfer
            .sourceStoreId,
        ).toBe(
          sourceStoreId,
        );

        expect(
          created.transfer
            .destinationStoreId,
        ).toBe(
          destinationStoreId,
        );

        expect(
          created.items,
        ).toHaveLength(1);

        expect(
          created.items[0],
        ).toEqual(
          expect.objectContaining({
            itemId,

            quantity:
              10,

            dispatchedQuantity:
              0,

            receivedQuantity:
              0,

            unitCost:
              25,
          }),
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a same-store transfer',
      async () => {
        await expect(
          service.createTransfer({
            propertyId,

            sourceStoreId,

            destinationStoreId:
              sourceStoreId,

            transferDate:
              '2026-07-15',

            createdByPersonId:
              actorId,

            items: [
              {
                itemId,

                quantity:
                  10,

                unitCost:
                  25,
              },
            ],
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          stockLedgerRepository
            .createTransfer,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'dispatches a cumulative target through TRANSFER_OUT',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        const dispatched =
          await service
            .dispatchTransfer(
              created.transfer.id,
              {
                dispatchedByPersonId:
                  actorId,

                items: [
                  {
                    transferItemId,

                    quantity:
                      6,
                  },
                ],
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .TRANSFER_OUT,

            itemId,

            storeId:
              sourceStoreId,

            binLocationId:
              sourceBinId,

            quantityDelta:
              -6,

            unitCost:
              25,
          }),
        );

        expect(
          dispatched.transfer
            .status,
        ).toBe(
          InventoryTransferStatus
            .DISPATCHED,
        );

        expect(
          dispatched.items[0]
            .dispatchedQuantity,
        ).toBe(6);
      },
    );

    it(
      'uses only the incremental dispatch quantity for a higher target',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    4,
                },
              ],
            },
          );

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    10,
                },
              ],
            },
          );

        const movements =
          stockLedgerRepository
            .postMovement
            .mock.calls
            .map(
              (
                call:
                  any[],
              ) =>
                call[0]
                  .quantityDelta,
            );

        expect(
          movements,
        ).toEqual([
          -4,
          -6,
        ]);

        expect(
          transferDetails
            .items[0]
            .dispatchedQuantity,
        ).toBe(10);
      },
    );

    it(
      'does not duplicate stock for an identical dispatch retry',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        const request = {
          dispatchedByPersonId:
            actorId,

          items: [
            {
              transferItemId,

              quantity:
                5,
            },
          ],
        };

        await service
          .dispatchTransfer(
            created.transfer.id,
            request,
          );

        await service
          .dispatchTransfer(
            created.transfer.id,
            request,
          );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'partially receives dispatched stock through TRANSFER_IN',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    10,
                },
              ],
            },
          );

        const received =
          await service
            .receiveTransfer(
              created.transfer.id,
              {
                receivedByPersonId:
                  actorId,

                items: [
                  {
                    transferItemId,

                    quantity:
                      4,
                  },
                ],
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .TRANSFER_IN,

            itemId,

            storeId:
              destinationStoreId,

            binLocationId:
              destinationBinId,

            quantityDelta:
              4,

            unitCost:
              25,
          }),
        );

        expect(
          received.transfer
            .status,
        ).toBe(
          InventoryTransferStatus
            .DISPATCHED,
        );

        expect(
          received.items[0]
            .receivedQuantity,
        ).toBe(4);
      },
    );

    it(
      'completes the transfer when the full quantity is received',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    10,
                },
              ],
            },
          );

        await service
          .receiveTransfer(
            created.transfer.id,
            {
              receivedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    4,
                },
              ],
            },
          );

        const completed =
          await service
            .receiveTransfer(
              created.transfer.id,
              {
                receivedByPersonId:
                  actorId,

                items: [
                  {
                    transferItemId,

                    quantity:
                      10,
                  },
                ],
              },
            );

        const transferInMovements =
          stockLedgerRepository
            .postMovement
            .mock.calls
            .map(
              (
                call:
                  any[],
              ) =>
                call[0],
            )
            .filter(
              (
                movement:
                  any,
              ) =>
                movement
                  .movementType ===
                InventoryStockMovementType
                  .TRANSFER_IN,
            );

        expect(
          transferInMovements
            .map(
              (
                movement:
                  any,
              ) =>
                movement
                  .quantityDelta,
            ),
        ).toEqual([
          4,
          6,
        ]);

        expect(
          completed.transfer
            .status,
        ).toBe(
          InventoryTransferStatus
            .RECEIVED,
        );

        expect(
          completed.items[0]
            .receivedQuantity,
        ).toBe(10);

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.transferred',
          'core.inventory',
          expect.objectContaining({
            entityId:
              created.transfer.id,

            completed:
              true,
          }),
        );
      },
    );

    it(
      'rejects receipt quantities above the dispatched quantity',
      async () => {
        const created =
          await createTransfer();

        const transferItemId =
          created.items[0].id;

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    5,
                },
              ],
            },
          );

        await expect(
          service.receiveTransfer(
            created.transfer.id,
            {
              receivedByPersonId:
                actorId,

              items: [
                {
                  transferItemId,

                  quantity:
                    6,
                },
              ],
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'cancels a DRAFT transfer without posting stock',
      async () => {
        const created =
          await createTransfer();

        const cancelled =
          await service
            .cancelTransfer(
              created.transfer.id,
              {
                cancelledByPersonId:
                  actorId,

                cancellationReason:
                  'Transfer no longer required',
              },
            );

        expect(
          cancelled.transfer
            .status,
        ).toBe(
          InventoryTransferStatus
            .CANCELLED,
        );

        expect(
          cancelled.transfer
            .cancellationReason,
        ).toBe(
          'Transfer no longer required',
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'prevents cancellation after dispatch',
      async () => {
        const created =
          await createTransfer();

        await service
          .dispatchTransfer(
            created.transfer.id,
            {
              dispatchedByPersonId:
                actorId,

              items: [
                {
                  transferItemId:
                    created.items[0]
                      .id,

                  quantity:
                    5,
                },
              ],
            },
          );

        await expect(
          service.cancelTransfer(
            created.transfer.id,
            {
              cancelledByPersonId:
                actorId,

              cancellationReason:
                'Attempted late cancellation',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  },
);
