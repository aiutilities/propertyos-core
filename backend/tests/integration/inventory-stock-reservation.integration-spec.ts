import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryStockReservationService,
} from '../../src/core/inventory/services/inventory-stock-reservation.service';

import {
  InventoryReservationStatus,
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Stock Reservation workflow',
  () => {
    const itemId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const binLocationId =
      '33333333-3333-4333-8333-333333333333';

    const actorId =
      '44444444-4444-4444-8444-444444444444';

    const sourceId =
      '55555555-5555-4555-8555-555555555555';

    let reservation:
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
      InventoryStockReservationService;

    beforeEach(
      () => {
        reservation =
          undefined;

        inventoryService = {
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

          getStore:
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
                storeId,
                isActive:
                  true,
              }),
            ),
        };

        stockLedgerRepository = {
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

                  reservedQuantityDelta:
                    input
                      .reservedQuantityDelta,

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

          createReservation:
            jest.fn(
              async (
                input: any,
              ) => {
                reservation = {
                  ...input,
                };

                return {
                  ...reservation,
                };
              },
            ),

          findReservationById:
            jest.fn(
              async () =>
                reservation
                  ? {
                      ...reservation,
                    }
                  : null,
            ),

          listReservations:
            jest.fn(
              async () =>
                reservation
                  ? [
                      {
                        ...reservation,
                      },
                    ]
                  : [],
            ),

          updateReservation:
            jest.fn(
              async (
                reservationId:
                  string,

                input: any,
              ) => {
                if (
                  !reservation ||
                  reservation.id !==
                    reservationId
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
                    reservation[
                      key
                    ] =
                      value;
                  }
                }

                return {
                  ...reservation,
                };
              },
            ),

          listExpiredReservations:
            jest.fn(
              async () =>
                reservation
                  ? [
                      {
                        ...reservation,
                      },
                    ]
                  : [],
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
          new InventoryStockReservationService(
            stockLedgerRepository,
            inventoryService,
            eventBus,
            auditService,
          );
      },
    );

    const createReservation =
      async (
        quantity = 10,
        expiresAt?: string,
      ) => {
        return service
          .createReservation({
            itemId,
            storeId,
            binLocationId,
            quantity,

            sourceType:
              'maintenance.work_order',

            sourceId,

            referenceNumber:
              'WO-001',

            reservedForPersonId:
              actorId,

            createdByPersonId:
              actorId,

            expiresAt,

            remarks:
              'Reservation test',

            metadata: {
              source:
                'integration-test',
            },
          });
      };

    it(
      'creates an ACTIVE reservation and reserves stock',
      async () => {
        const created =
          await createReservation();

        expect(
          created.status,
        ).toBe(
          InventoryReservationStatus
            .ACTIVE,
        );

        expect(
          created.quantity,
        ).toBe(10);

        expect(
          created.fulfilledQuantity,
        ).toBe(0);

        expect(
          created.releasedQuantity,
        ).toBe(0);

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .RESERVATION,

            itemId,

            storeId,

            binLocationId,

            quantityDelta:
              0,

            reservedQuantityDelta:
              10,
          }),
        );
      },
    );

    it(
      'rejects a non-positive reservation quantity',
      async () => {
        await expect(
          createReservation(0),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'partially fulfills through ISSUE and releases reserved quantity',
      async () => {
        const created =
          await createReservation();

        const fulfilled =
          await service
            .fulfillReservation(
              created.id,
              {
                quantity:
                  4,

                fulfilledByPersonId:
                  actorId,

                remarks:
                  'Partial issue',
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .ISSUE,

            quantityDelta:
              -4,

            reservedQuantityDelta:
              -4,
          }),
        );

        expect(
          fulfilled
            .fulfilledQuantity,
        ).toBe(4);

        expect(
          fulfilled.status,
        ).toBe(
          InventoryReservationStatus
            .PARTIALLY_FULFILLED,
        );
      },
    );

    it(
      'uses only the incremental quantity for higher fulfillment targets',
      async () => {
        const created =
          await createReservation();

        await service
          .fulfillReservation(
            created.id,
            {
              quantity:
                4,

              fulfilledByPersonId:
                actorId,
            },
          );

        await service
          .fulfillReservation(
            created.id,
            {
              quantity:
                10,

              fulfilledByPersonId:
                actorId,
            },
          );

        const issueMovements =
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
                  .ISSUE,
            );

        expect(
          issueMovements
            .map(
              (
                movement:
                  any,
              ) =>
                movement
                  .quantityDelta,
            ),
        ).toEqual([
          -4,
          -6,
        ]);

        expect(
          reservation
            .fulfilledQuantity,
        ).toBe(10);

        expect(
          reservation.status,
        ).toBe(
          InventoryReservationStatus
            .FULFILLED,
        );
      },
    );

    it(
      'does not duplicate stock for an identical fulfillment retry',
      async () => {
        const created =
          await createReservation();

        const request = {
          quantity:
            5,

          fulfilledByPersonId:
            actorId,
        };

        await service
          .fulfillReservation(
            created.id,
            request,
          );

        await service
          .fulfillReservation(
            created.id,
            request,
          );

        const issueCalls =
          stockLedgerRepository
            .postMovement
            .mock.calls
            .filter(
              (
                call:
                  any[],
              ) =>
                call[0]
                  .movementType ===
                InventoryStockMovementType
                  .ISSUE,
            );

        expect(
          issueCalls,
        ).toHaveLength(1);
      },
    );

    it(
      'partially releases reserved stock',
      async () => {
        const created =
          await createReservation();

        const released =
          await service
            .releaseReservation(
              created.id,
              {
                quantity:
                  3,

                releasedByPersonId:
                  actorId,

                remarks:
                  'Partial release',
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .RESERVATION_RELEASE,

            quantityDelta:
              0,

            reservedQuantityDelta:
              -3,
          }),
        );

        expect(
          released
            .releasedQuantity,
        ).toBe(3);

        expect(
          released.status,
        ).toBe(
          InventoryReservationStatus
            .PARTIALLY_FULFILLED,
        );
      },
    );

    it(
      'fully releases the remaining reservation',
      async () => {
        const created =
          await createReservation();

        await service
          .releaseReservation(
            created.id,
            {
              quantity:
                4,

              releasedByPersonId:
                actorId,
            },
          );

        const fullyReleased =
          await service
            .releaseReservation(
              created.id,
              {
                quantity:
                  10,

              releasedByPersonId:
                actorId,
            },
          );

        const releaseMovements =
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
                  .RESERVATION_RELEASE,
            );

        expect(
          releaseMovements
            .map(
              (
                movement:
                  any,
              ) =>
                movement
                  .reservedQuantityDelta,
            ),
        ).toEqual([
          -4,
          -6,
        ]);

        expect(
          fullyReleased.status,
        ).toBe(
          InventoryReservationStatus
            .RELEASED,
        );
      },
    );

    it(
      'rejects fulfillment above the remaining reservable quantity',
      async () => {
        const created =
          await createReservation();

        await service
          .releaseReservation(
            created.id,
            {
              quantity:
                4,

              releasedByPersonId:
                actorId,
            },
          );

        await expect(
          service
            .fulfillReservation(
              created.id,
              {
                quantity:
                  7,

                fulfilledByPersonId:
                  actorId,
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'expires the remaining open quantity',
      async () => {
        const created =
          await createReservation(
            10,
            '2099-01-01T00:00:00.000Z',
          );

        reservation.expiresAt =
          new Date(
            '2026-07-14T00:00:00.000Z',
          );

        const expired =
          await service
            .expireReservation(
              created.id,
              {
                expiredByPersonId:
                  actorId,

                remarks:
                  'Expired by test',
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .RESERVATION_RELEASE,

            reservedQuantityDelta:
              -10,
          }),
        );

        expect(
          expired.status,
        ).toBe(
          InventoryReservationStatus
            .EXPIRED,
        );

        expect(
          expired.releasedQuantity,
        ).toBe(10);
      },
    );

    it(
      'rejects expiry before the configured expiry time',
      async () => {
        const created =
          await createReservation(
            10,
            '2099-01-01T00:00:00.000Z',
          );

        await expect(
          service
            .expireReservation(
              created.id,
              {},
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'expires all reservations returned by the due-reservation query',
      async () => {
        await createReservation(
          8,
          '2099-01-01T00:00:00.000Z',
        );

        reservation.expiresAt =
          new Date(
            '2026-07-14T00:00:00.000Z',
          );

        const results =
          await service
            .expireDueReservations(
              new Date(
                '2026-07-15T00:00:00.000Z',
              ),
            );

        expect(
          stockLedgerRepository
            .listExpiredReservations,
        ).toHaveBeenCalled();

        expect(results).toHaveLength(1);

        expect(
          results[0].status,
        ).toBe(
          InventoryReservationStatus
            .EXPIRED,
        );
      },
    );

    it(
      'prevents changes after a reservation is fulfilled',
      async () => {
        const created =
          await createReservation();

        await service
          .fulfillReservation(
            created.id,
            {
              quantity:
                10,

              fulfilledByPersonId:
                actorId,
            },
          );

        await expect(
          service
            .releaseReservation(
              created.id,
              {
                quantity:
                  1,

                releasedByPersonId:
                  actorId,
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  },
);
