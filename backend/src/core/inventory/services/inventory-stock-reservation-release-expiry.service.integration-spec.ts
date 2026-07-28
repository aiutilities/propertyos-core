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
  InventoryReservationStatus,
  InventoryStockMovementType,
  InventoryStockReservation,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

import {
  InventoryStockReservationService,
} from './inventory-stock-reservation.service';

describe(
  'InventoryStockReservationService release and expiry FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryStockLedgerRepository>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryStockReservationService;

    const reservation:
      InventoryStockReservation = {
        id:
          'reservation-1',
        reservationNumber:
          'RSV-20260728-0000000001',
        itemId:
          'item-1',
        storeId:
          'store-1',
        binLocationId:
          'bin-1',
        batchId:
          'batch-1',
        quantity:
          5,
        fulfilledQuantity:
          0,
        releasedQuantity:
          0,
        status:
          InventoryReservationStatus.ACTIVE,
        sourceType:
          'maintenance_request',
        sourceId:
          'source-1',
        referenceNumber:
          'MR-001',
        reservedForPersonId:
          'person-1',
        createdByPersonId:
          'founder-person-1',
        remarks:
          'Reserve switches',
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
        findReservationById:
          jest.fn(),
        postMovement:
          jest.fn(),
        updateReservation:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

      repository.findReservationById
        .mockResolvedValue(
          reservation,
        );

      repository.postMovement
        .mockResolvedValue(
          movementResult,
        );

      repository.updateReservation
        .mockImplementation(
          async (
            _reservationId,
            input,
          ) => ({
            ...reservation,
            fulfilledQuantity:
              input.fulfilledQuantity,
            releasedQuantity:
              input.releasedQuantity,
            status:
              input.status,
            releasedByPersonId:
              input.releasedByPersonId,
            releasedAt:
              input.releasedAt,
            fulfilledByPersonId:
              input.fulfilledByPersonId,
            fulfilledAt:
              input.fulfilledAt,
            remarks:
              input.remarks,
            updatedAt:
              input.updatedAt,
          }),
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

      service =
        new InventoryStockReservationService(
          repository,
          {} as InventoryService,
          eventBus,
          auditService,
        );
    });

    it(
      'fully releases a reservation through an idempotent RESERVATION_RELEASE movement',
      async () => {
        const result =
          await service.releaseReservation(
            reservation.id,
            {
              quantity:
                5,
              releasedByPersonId:
                'founder-person-2',
              remarks:
                ' Release unused reservation ',
            },
          );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType
              .RESERVATION_RELEASE,
          itemId:
            reservation.itemId,
          storeId:
            reservation.storeId,
          binLocationId:
            reservation.binLocationId,
          batchId:
            reservation.batchId,
          quantityDelta:
            0,
          reservedQuantityDelta:
            -5,
          sourceType:
            'inventory.stock_reservation',
          sourceId:
            reservation.id,
          referenceNumber:
            reservation.reservationNumber,
          idempotencyKey:
            'inventory-reservation:release:reservation-1:5',
          correlationId:
            reservation.id,
          postedByPersonId:
            'founder-person-2',
          remarks:
            'Release unused reservation',
          metadata: {
            reservationId:
              reservation.id,
            releaseTarget:
              5,
            releaseDelta:
              5,
          },
        });

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            fulfilledQuantity:
              0,
            releasedQuantity:
              5,
            status:
              InventoryReservationStatus
                .RELEASED,
            releasedByPersonId:
              'founder-person-2',
            releasedAt:
              expect.any(Date),
            remarks:
              'Release unused reservation',
            updatedAt:
              expect.any(Date),
          }),
        );

        expect(result).toEqual(
          expect.objectContaining({
            releasedQuantity:
              5,
            status:
              InventoryReservationStatus
                .RELEASED,
            releasedByPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'posts only the incremental release quantity',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            releasedQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await service.releaseReservation(
          reservation.id,
          {
            quantity:
              5,
            releasedByPersonId:
              'founder-person-2',
          },
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            quantityDelta:
              0,
            reservedQuantityDelta:
              -3,
            idempotencyKey:
              'inventory-reservation:release:reservation-1:5',
            metadata:
              expect.objectContaining({
                releaseTarget:
                  5,
                releaseDelta:
                  3,
              }),
          }),
        );
      },
    );

    it(
      'keeps a partial release open',
      async () => {
        const result =
          await service.releaseReservation(
            reservation.id,
            {
              quantity:
                2,
              releasedByPersonId:
                'founder-person-2',
            },
          );

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            fulfilledQuantity:
              0,
            releasedQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
            releasedAt:
              undefined,
          }),
        );

        expect(result.status).toBe(
          InventoryReservationStatus
            .PARTIALLY_FULFILLED,
        );
      },
    );

    it(
      'does not post another movement when the release target is already reached',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            releasedQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await service.releaseReservation(
          reservation.id,
          {
            quantity:
              2,
            releasedByPersonId:
              'founder-person-2',
          },
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            releasedQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          }),
        );
      },
    );

    it(
      'records release event and audit evidence',
      async () => {
        await service.releaseReservation(
          reservation.id,
          {
            quantity:
              5,
            releasedByPersonId:
              'founder-person-2',
          },
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_reservation',
            entityId:
              reservation.id,
            reservationId:
              reservation.id,
            reservationNumber:
              reservation.reservationNumber,
            itemId:
              reservation.itemId,
            storeId:
              reservation.storeId,
            releasedQuantity:
              5,
            status:
              InventoryReservationStatus
                .RELEASED,
            actorPersonId:
              'founder-person-2',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_RELEASED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_RELEASED,
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'rejects release below the quantity already released',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            releasedQuantity:
              3,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await expect(
          service.releaseReservation(
            reservation.id,
            {
              quantity:
                2,
              releasedByPersonId:
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
          repository.updateReservation,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects release above the unfulfilled reservation quantity',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            fulfilledQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await expect(
          service.releaseReservation(
            reservation.id,
            {
              quantity:
                4,
              releasedByPersonId:
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
      'expires the remaining open quantity through RESERVATION_RELEASE',
      async () => {
        const expiredReservation = {
          ...reservation,
          fulfilledQuantity:
            2,
          releasedQuantity:
            1,
          status:
            InventoryReservationStatus
              .PARTIALLY_FULFILLED,
          expiresAt:
            new Date(
              '2026-07-27T00:00:00.000Z',
            ),
        };

        repository.findReservationById
          .mockResolvedValue(
            expiredReservation,
          );

        repository.updateReservation
          .mockImplementation(
            async (
              _reservationId,
              input,
            ) => ({
              ...expiredReservation,
              fulfilledQuantity:
                input.fulfilledQuantity,
              releasedQuantity:
                input.releasedQuantity,
              status:
                input.status,
              releasedByPersonId:
                input.releasedByPersonId,
              releasedAt:
                input.releasedAt,
              remarks:
                input.remarks,
              updatedAt:
                input.updatedAt,
            }),
          );

        const result =
          await service.expireReservation(
            reservation.id,
            {
              expiredByPersonId:
                'founder-person-3',
              remarks:
                ' Reservation expired ',
            },
          );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType
              .RESERVATION_RELEASE,
          itemId:
            reservation.itemId,
          storeId:
            reservation.storeId,
          binLocationId:
            reservation.binLocationId,
          batchId:
            reservation.batchId,
          quantityDelta:
            0,
          reservedQuantityDelta:
            -2,
          sourceType:
            'inventory.stock_reservation',
          sourceId:
            reservation.id,
          referenceNumber:
            reservation.reservationNumber,
          idempotencyKey:
            'inventory-reservation:expire:reservation-1',
          correlationId:
            reservation.id,
          postedByPersonId:
            'founder-person-3',
          remarks:
            'Reservation expired',
          metadata: {
            reservationId:
              reservation.id,
            batchId:
              reservation.batchId,
            expiredQuantity:
              2,
          },
        });

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            fulfilledQuantity:
              2,
            releasedQuantity:
              3,
            status:
              InventoryReservationStatus
                .EXPIRED,
            releasedByPersonId:
              'founder-person-3',
            releasedAt:
              expect.any(Date),
            remarks:
              'Reservation expired',
            updatedAt:
              expect.any(Date),
          }),
        );

        expect(result.status).toBe(
          InventoryReservationStatus.EXPIRED,
        );
      },
    );

    it(
      'rejects expiring a reservation before its expiry time',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            expiresAt:
              new Date(
                Date.now() +
                24 * 60 * 60 * 1000,
              ),
          });

        await expect(
          service.expireReservation(
            reservation.id,
            {
              expiredByPersonId:
                'founder-person-3',
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
      'rejects expiry when no reservable quantity remains',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            fulfilledQuantity:
              3,
            releasedQuantity:
              2,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
            expiresAt:
              new Date(
                '2026-07-27T00:00:00.000Z',
              ),
          });

        await expect(
          service.expireReservation(
            reservation.id,
            {
              expiredByPersonId:
                'founder-person-3',
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
      'rejects release or expiry of a closed reservation',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            releasedQuantity:
              5,
            status:
              InventoryReservationStatus
                .RELEASED,
          });

        await expect(
          service.releaseReservation(
            reservation.id,
            {
              quantity:
                5,
              releasedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        await expect(
          service.expireReservation(
            reservation.id,
            {
              expiredByPersonId:
                'founder-person-3',
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
      'fails closed when release persistence cannot find the reservation',
      async () => {
        repository.updateReservation
          .mockResolvedValue(null);

        await expect(
          service.releaseReservation(
            reservation.id,
            {
              quantity:
                5,
              releasedByPersonId:
                'founder-person-2',
            },
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(1);

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
