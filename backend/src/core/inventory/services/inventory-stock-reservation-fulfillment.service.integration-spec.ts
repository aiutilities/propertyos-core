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
  'InventoryStockReservationService fulfillment FAT contract',
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
      'fully fulfills a reservation through an idempotent ISSUE movement',
      async () => {
        const result =
          await service
            .fulfillReservation(
              reservation.id,
              {
                quantity:
                  5,
                fulfilledByPersonId:
                  'founder-person-2',
                remarks:
                  ' Fulfilled for repair ',
              },
            );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith({
          movementType:
            InventoryStockMovementType.ISSUE,
          itemId:
            reservation.itemId,
          storeId:
            reservation.storeId,
          binLocationId:
            reservation.binLocationId,
          batchId:
            reservation.batchId,
          quantityDelta:
            -5,
          reservedQuantityDelta:
            -5,
          sourceType:
            'inventory.stock_reservation',
          sourceId:
            reservation.id,
          referenceNumber:
            reservation.reservationNumber,
          idempotencyKey:
            'inventory-reservation:fulfill:reservation-1:5',
          correlationId:
            reservation.id,
          postedByPersonId:
            'founder-person-2',
          remarks:
            'Fulfilled for repair',
          metadata: {
            reservationId:
              reservation.id,
            fulfillmentTarget:
              5,
            fulfillmentDelta:
              5,
            reservationSourceType:
              reservation.sourceType,
            reservationSourceId:
              reservation.sourceId,
          },
        });

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            fulfilledQuantity:
              5,
            releasedQuantity:
              0,
            status:
              InventoryReservationStatus
                .FULFILLED,
            fulfilledByPersonId:
              'founder-person-2',
            fulfilledAt:
              expect.any(Date),
            remarks:
              'Fulfilled for repair',
            updatedAt:
              expect.any(Date),
          }),
        );

        expect(result).toEqual(
          expect.objectContaining({
            fulfilledQuantity:
              5,
            releasedQuantity:
              0,
            status:
              InventoryReservationStatus
                .FULFILLED,
            fulfilledByPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'posts only the incremental fulfillment quantity',
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

        await service.fulfillReservation(
          reservation.id,
          {
            quantity:
              5,
            fulfilledByPersonId:
              'founder-person-2',
          },
        );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            quantityDelta:
              -3,
            reservedQuantityDelta:
              -3,
            idempotencyKey:
              'inventory-reservation:fulfill:reservation-1:5',
            metadata:
              expect.objectContaining({
                fulfillmentTarget:
                  5,
                fulfillmentDelta:
                  3,
              }),
          }),
        );
      },
    );

    it(
      'keeps a partial fulfillment open',
      async () => {
        const result =
          await service
            .fulfillReservation(
              reservation.id,
              {
                quantity:
                  3,
                fulfilledByPersonId:
                  'founder-person-2',
              },
            );

        expect(
          repository.updateReservation,
        ).toHaveBeenCalledWith(
          reservation.id,
          expect.objectContaining({
            fulfilledQuantity:
              3,
            releasedQuantity:
              0,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
            fulfilledAt:
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
      'does not post another movement when the target is already fulfilled',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            fulfilledQuantity:
              3,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await service.fulfillReservation(
          reservation.id,
          {
            quantity:
              3,
            fulfilledByPersonId:
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
            fulfilledQuantity:
              3,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          }),
        );
      },
    );

    it(
      'records fulfillment event and audit evidence',
      async () => {
        await service.fulfillReservation(
          reservation.id,
          {
            quantity:
              5,
            fulfilledByPersonId:
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
            fulfilledQuantity:
              5,
            status:
              InventoryReservationStatus
                .FULFILLED,
            actorPersonId:
              'founder-person-2',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.stock.reservation.fulfilled',
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          'inventory.stock.reservation.fulfilled',
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'rejects fulfillment below the quantity already fulfilled',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            fulfilledQuantity:
              3,
            status:
              InventoryReservationStatus
                .PARTIALLY_FULFILLED,
          });

        await expect(
          service.fulfillReservation(
            reservation.id,
            {
              quantity:
                2,
              fulfilledByPersonId:
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
      'rejects fulfillment above the unreleased reservation quantity',
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

        await expect(
          service.fulfillReservation(
            reservation.id,
            {
              quantity:
                4,
              fulfilledByPersonId:
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
      'rejects fulfillment of a closed reservation',
      async () => {
        repository.findReservationById
          .mockResolvedValue({
            ...reservation,
            fulfilledQuantity:
              5,
            status:
              InventoryReservationStatus
                .FULFILLED,
          });

        await expect(
          service.fulfillReservation(
            reservation.id,
            {
              quantity:
                5,
              fulfilledByPersonId:
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
      'fails closed when the reservation update cannot find the entity',
      async () => {
        repository.updateReservation
          .mockResolvedValue(null);

        await expect(
          service.fulfillReservation(
            reservation.id,
            {
              quantity:
                5,
              fulfilledByPersonId:
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
