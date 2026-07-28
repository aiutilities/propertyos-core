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
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryReservationStatus,
  InventoryStockMovementType,
  InventoryStockReservation,
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

import {
  InventoryStockReservationService,
} from './inventory-stock-reservation.service';

describe(
  'InventoryStockReservationService foundation FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryStockLedgerRepository>;

    let inventoryService:
      jest.Mocked<
        Pick<
          InventoryService,
          | 'getItem'
          | 'getStore'
          | 'getBinLocation'
        >
      >;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryStockReservationService;

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

    const bin:
      InventoryBinLocation = {
        id:
          'bin-1',
        storeId:
          store.id,
        binCode:
          'RESERVE-01',
        name:
          'Reservation Bin',
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
        postMovement:
          jest.fn(),
        createReservation:
          jest.fn(),
        findReservationById:
          jest.fn(),
        listReservations:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryStockLedgerRepository>;

      inventoryService = {
        getItem:
          jest.fn(),
        getStore:
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

      inventoryService.getItem
        .mockResolvedValue(item);

      inventoryService.getStore
        .mockResolvedValue(store);

      inventoryService.getBinLocation
        .mockResolvedValue(bin);

      repository.postMovement
        .mockResolvedValue(
          movementResult,
        );

      repository.createReservation
        .mockImplementation(
          async (
            reservation:
              InventoryStockReservation,
          ) => reservation,
        );

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      service =
        new InventoryStockReservationService(
          repository,
          inventoryService as unknown as
            InventoryService,
          eventBus,
          auditService,
        );
    });

    it(
      'creates an active reservation and posts reserved quantity evidence',
      async () => {
        const expiresAt =
          new Date(
            Date.now() +
            24 * 60 * 60 * 1000,
          ).toISOString();

        const created =
          await service.createReservation({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantity:
              5,
            sourceType:
              ' maintenance_request ',
            sourceId:
              'source-1',
            referenceNumber:
              ' MR-001 ',
            reservedForPersonId:
              'person-1',
            createdByPersonId:
              'founder-person-1',
            expiresAt,
            remarks:
              ' Reserve switches ',
            metadata: {
              purpose:
                'repair',
            },
          });

        expect(created).toEqual(
          expect.objectContaining({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantity:
              5,
            fulfilledQuantity:
              0,
            releasedQuantity:
              0,
            status:
              InventoryReservationStatus
                .ACTIVE,
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
            metadata: {
              purpose:
                'repair',
            },
          }),
        );

        expect(
          created.reservationNumber,
        ).toMatch(
          /^RSV-[0-9]{8}-[A-F0-9]{10}$/,
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
                .RESERVATION,
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantityDelta:
              0,
            reservedQuantityDelta:
              5,
            sourceType:
              'inventory.stock_reservation',
            sourceId:
              created.id,
            referenceNumber:
              created.reservationNumber,
            idempotencyKey:
              `inventory-reservation:create:${created.id}`,
            correlationId:
              created.id,
            postedByPersonId:
              'founder-person-1',
            remarks:
              'Reserve switches',
            metadata: {
              reservationId:
                created.id,
              reservationNumber:
                created.reservationNumber,
              reservationSourceType:
                'maintenance_request',
              reservationSourceId:
                'source-1',
              reservedForPersonId:
                'person-1',
              expiresAt,
            },
          }),
        );

        expect(
          repository.createReservation,
        ).toHaveBeenCalledWith(
          created,
        );

        const evidence =
          expect.objectContaining({
            entityType:
              'inventory.stock_reservation',
            entityId:
              created.id,
            reservationId:
              created.id,
            reservationNumber:
              created.reservationNumber,
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantity:
              5,
            sourceType:
              'maintenance_request',
            sourceId:
              'source-1',
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_RESERVED,
          'core.inventory',
          evidence,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STOCK_RESERVED,
          'core.inventory',
          evidence,
        );
      },
    );

    it(
      'lists reservations with a normalized status',
      async () => {
        repository.listReservations
          .mockResolvedValue([]);

        await expect(
          service.listReservations({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            sourceType:
              'maintenance_request',
            sourceId:
              'source-1',
            status:
              ' active ',
          }),
        ).resolves.toEqual([]);

        expect(
          repository.listReservations,
        ).toHaveBeenCalledWith({
          itemId:
            item.id,
          storeId:
            store.id,
          binLocationId:
            bin.id,
          batchId:
            undefined,
          sourceType:
            'maintenance_request',
          sourceId:
            'source-1',
          status:
            InventoryReservationStatus
              .ACTIVE,
        });
      },
    );

    it(
      'retrieves an existing reservation',
      async () => {
        const reservation = {
          id:
            'reservation-1',
          reservationNumber:
            'RSV-20260728-0000000001',
          itemId:
            item.id,
          storeId:
            store.id,
          quantity:
            5,
          fulfilledQuantity:
            0,
          releasedQuantity:
            0,
          status:
            InventoryReservationStatus
              .ACTIVE,
          sourceType:
            'maintenance_request',
          metadata:
            {},
          createdAt:
            new Date(),
          updatedAt:
            new Date(),
        } as InventoryStockReservation;

        repository.findReservationById
          .mockResolvedValue(
            reservation,
          );

        await expect(
          service.getReservation(
            reservation.id,
          ),
        ).resolves.toEqual(
          reservation,
        );
      },
    );

    it(
      'requires sourceType before posting or persistence',
      async () => {
        await expect(
          service.createReservation({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            sourceType:
              '   ',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();

        expect(
          repository.createReservation,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'requires a Batch for a Batch-tracked item',
      async () => {
        inventoryService.getItem
          .mockResolvedValue({
            ...item,
            isBatchTracked:
              true,
          });

        await expect(
          service.createReservation({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            sourceType:
              'maintenance_request',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an inactive or mismatched bin',
      async () => {
        inventoryService
          .getBinLocation
          .mockResolvedValue({
            ...bin,
            storeId:
              'foreign-store',
          });

        await expect(
          service.createReservation({
            itemId:
              item.id,
            storeId:
              store.id,
            binLocationId:
              bin.id,
            quantity:
              1,
            sourceType:
              'maintenance_request',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an expiry date that is not in the future',
      async () => {
        await expect(
          service.createReservation({
            itemId:
              item.id,
            storeId:
              store.id,
            quantity:
              1,
            sourceType:
              'maintenance_request',
            expiresAt:
              '2020-01-01T00:00:00.000Z',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown reservation',
      async () => {
        repository.findReservationById
          .mockResolvedValue(null);

        await expect(
          service.getReservation(
            'missing-reservation',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  },
);
