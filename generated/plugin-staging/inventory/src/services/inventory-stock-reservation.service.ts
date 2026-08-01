import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'crypto';

import {
  AuditService,
} from '@propertyos/core-contracts';

import {
  EventBusService,
} from '@propertyos/core-contracts';

import {
  CreateStockReservationDto,
  ExpireStockReservationDto,
  FulfillStockReservationDto,
  ReleaseStockReservationDto,
} from '../dto';

import {
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryReservationStatus,
  InventoryStockMovementType,
  InventoryStockReservation,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

@Injectable()
export class InventoryStockReservationService {
  constructor(
    @Inject(
      INVENTORY_STOCK_LEDGER_REPOSITORY,
    )
    private readonly stockLedgerRepository:
      InventoryStockLedgerRepository,

    private readonly inventoryService:
      InventoryService,

    private readonly eventBus:
      EventBusService,

    private readonly auditService:
      AuditService,
  ) {}

  async createReservation(
    dto: CreateStockReservationDto,
  ) {
    const quantity =
      this.requirePositiveQuantity(
        dto.quantity,
        'quantity',
      );

    if (!dto.sourceType?.trim()) {
      throw new BadRequestException(
        'sourceType is required',
      );
    }

    const item =
      await this.inventoryService
        .getItem(dto.itemId);

    if (!item.isActive) {
      throw new BadRequestException(
        `Inventory item is inactive: ${item.id}`,
      );
    }

    if (
      item.isBatchTracked &&
      !dto.batchId
    ) {
      throw new BadRequestException(
        `batchId is required for batch-tracked Inventory item: ${item.id}`,
      );
    }

    if (
      !item.isBatchTracked &&
      dto.batchId
    ) {
      throw new BadRequestException(
        `batchId cannot be used for an Inventory item that is not batch tracked: ${item.id}`,
      );
    }

    const store =
      await this.inventoryService
        .getStore(dto.storeId);

    if (!store.isActive) {
      throw new BadRequestException(
        `Inventory store is inactive: ${store.id}`,
      );
    }

    if (dto.binLocationId) {
      const bin =
        await this.inventoryService
          .getBinLocation(
            dto.binLocationId,
          );

      if (
        !bin.isActive ||
        bin.storeId !== dto.storeId
      ) {
        throw new BadRequestException(
          'Invalid, inactive, or mismatched Inventory bin location',
        );
      }
    }

    const now =
      new Date();

    const expiresAt =
      dto.expiresAt
        ? this.requireDate(
            dto.expiresAt,
            'expiresAt',
          )
        : undefined;

    if (
      expiresAt &&
      expiresAt.getTime() <=
        now.getTime()
    ) {
      throw new BadRequestException(
        'expiresAt must be in the future',
      );
    }

    const id =
      randomUUID();

    const reservation:
      InventoryStockReservation = {
        id,

        reservationNumber:
          this.reservationNumber(
            now,
            id,
          ),

        itemId:
          dto.itemId,

        storeId:
          dto.storeId,

        binLocationId:
          dto.binLocationId,

        batchId:
          dto.batchId,

        quantity,

        fulfilledQuantity:
          0,

        releasedQuantity:
          0,

        status:
          InventoryReservationStatus
            .ACTIVE,

        sourceType:
          dto.sourceType.trim(),

        sourceId:
          dto.sourceId,

        referenceNumber:
          this.optionalText(
            dto.referenceNumber,
          ),

        reservedForPersonId:
          dto.reservedForPersonId,

        createdByPersonId:
          dto.createdByPersonId,

        expiresAt,

        remarks:
          this.optionalText(
            dto.remarks,
          ),

        metadata:
          dto.metadata ?? {},

        createdAt:
          now,

        updatedAt:
          now,
      };

    await this
      .stockLedgerRepository
      .postMovement({
        movementType:
          InventoryStockMovementType
            .RESERVATION,

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
          quantity,

        sourceType:
          'inventory.stock_reservation',

        sourceId:
          reservation.id,

        referenceNumber:
          reservation
            .reservationNumber,

        idempotencyKey:
          [
            'inventory-reservation',
            'create',
            reservation.id,
          ].join(':'),

        correlationId:
          reservation.id,

        postedByPersonId:
          reservation
            .createdByPersonId,

        remarks:
          reservation.remarks,

        metadata: {
          reservationId:
            reservation.id,

          reservationNumber:
            reservation
              .reservationNumber,

          reservationSourceType:
            reservation.sourceType,

          reservationSourceId:
            reservation.sourceId,

          reservedForPersonId:
            reservation
              .reservedForPersonId,

          expiresAt:
            reservation.expiresAt
              ?.toISOString(),
        },
      });

    const created =
      await this
        .stockLedgerRepository
        .createReservation(
          reservation,
        );

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .STOCK_RESERVED,
      created.id,
      {
        reservationId:
          created.id,

        reservationNumber:
          created.reservationNumber,

        itemId:
          created.itemId,

        storeId:
          created.storeId,

        binLocationId:
          created.binLocationId,

        quantity:
          created.quantity,

        sourceType:
          created.sourceType,

        sourceId:
          created.sourceId,

        actorPersonId:
          created.createdByPersonId,
      },
    );

    return created;
  }

  async getReservation(
    id: string,
  ) {
    const reservation =
      await this
        .stockLedgerRepository
        .findReservationById(id);

    if (!reservation) {
      throw new NotFoundException(
        `Inventory stock reservation not found: ${id}`,
      );
    }

    return reservation;
  }

  listReservations(
    filters: {
      itemId?: string;
      storeId?: string;
      binLocationId?: string;
      batchId?: string;
      sourceType?: string;
      sourceId?: string;
      status?: string;
    } = {},
  ) {
    const status =
      filters.status
        ? this.requireReservationStatus(
            filters.status,
          )
        : undefined;

    return this
      .stockLedgerRepository
      .listReservations({
        itemId:
          filters.itemId,

        storeId:
          filters.storeId,

        binLocationId:
          filters.binLocationId,

        batchId:
          filters.batchId,

        sourceType:
          filters.sourceType,

        sourceId:
          filters.sourceId,

        status,
      });
  }

  async releaseReservation(
    id: string,
    dto:
      ReleaseStockReservationDto,
  ) {
    const reservation =
      await this.getReservation(id);

    this.requireOpenReservation(
      reservation,
      'released',
    );

    const targetReleased =
      this.requirePositiveQuantity(
        dto.quantity,
        'quantity',
      );

    if (
      targetReleased <
      reservation.releasedQuantity
    ) {
      throw new BadRequestException(
        'Release target cannot be lower than the quantity already released',
      );
    }

    const maximumReleasable =
      this.roundQuantity(
        reservation.quantity -
        reservation
          .fulfilledQuantity,
      );

    if (
      targetReleased >
      maximumReleasable
    ) {
      throw new BadRequestException(
        `Release target cannot exceed ${maximumReleasable}`,
      );
    }

    const delta =
      this.roundQuantity(
        targetReleased -
        reservation.releasedQuantity,
      );

    if (delta > 0) {
      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            InventoryStockMovementType
              .RESERVATION_RELEASE,

          itemId:
            reservation.itemId,

          storeId:
            reservation.storeId,

          binLocationId:
            reservation
              .binLocationId,

          batchId:
            reservation
              .batchId,

          quantityDelta:
            0,

          reservedQuantityDelta:
            -delta,

          sourceType:
            'inventory.stock_reservation',

          sourceId:
            reservation.id,

          referenceNumber:
            reservation
              .reservationNumber,

          idempotencyKey:
            [
              'inventory-reservation',
              'release',
              reservation.id,
              targetReleased,
            ].join(':'),

          correlationId:
            reservation.id,

          postedByPersonId:
            dto.releasedByPersonId,

          remarks:
            this.optionalText(
              dto.remarks,
            ) ??
            reservation.remarks,

          metadata: {
            reservationId:
              reservation.id,

            releaseTarget:
              targetReleased,

            releaseDelta:
              delta,
          },
        });
    }

    const fullyClosed =
      this.roundQuantity(
        reservation
          .fulfilledQuantity +
        targetReleased,
      ) === reservation.quantity;

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateReservation(
          reservation.id,
          {
            fulfilledQuantity:
              reservation
                .fulfilledQuantity,

            releasedQuantity:
              targetReleased,

            status:
              fullyClosed
                ? InventoryReservationStatus
                    .RELEASED
                : InventoryReservationStatus
                    .PARTIALLY_FULFILLED,

            releasedByPersonId:
              dto.releasedByPersonId,

            releasedAt:
              fullyClosed
                ? now
                : undefined,

            remarks:
              this.optionalText(
                dto.remarks,
              ),

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory stock reservation not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .STOCK_RELEASED,
      updated.id,
      {
        reservationId:
          updated.id,

        reservationNumber:
          updated.reservationNumber,

        itemId:
          updated.itemId,

        storeId:
          updated.storeId,

        releasedQuantity:
          updated.releasedQuantity,

        status:
          updated.status,

        actorPersonId:
          dto.releasedByPersonId,
      },
    );

    return updated;
  }

  async fulfillReservation(
    id: string,
    dto:
      FulfillStockReservationDto,
  ) {
    const reservation =
      await this.getReservation(id);

    this.requireOpenReservation(
      reservation,
      'fulfilled',
    );

    const targetFulfilled =
      this.requirePositiveQuantity(
        dto.quantity,
        'quantity',
      );

    if (
      targetFulfilled <
      reservation.fulfilledQuantity
    ) {
      throw new BadRequestException(
        'Fulfillment target cannot be lower than the quantity already fulfilled',
      );
    }

    const maximumFulfillable =
      this.roundQuantity(
        reservation.quantity -
        reservation
          .releasedQuantity,
      );

    if (
      targetFulfilled >
      maximumFulfillable
    ) {
      throw new BadRequestException(
        `Fulfillment target cannot exceed ${maximumFulfillable}`,
      );
    }

    const delta =
      this.roundQuantity(
        targetFulfilled -
        reservation
          .fulfilledQuantity,
      );

    if (delta > 0) {
      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            InventoryStockMovementType
              .ISSUE,

          itemId:
            reservation.itemId,

          storeId:
            reservation.storeId,

          binLocationId:
            reservation
              .binLocationId,

          batchId:
            reservation
              .batchId,

          quantityDelta:
            -delta,

          reservedQuantityDelta:
            -delta,

          sourceType:
            'inventory.stock_reservation',

          sourceId:
            reservation.id,

          referenceNumber:
            reservation
              .reservationNumber,

          idempotencyKey:
            [
              'inventory-reservation',
              'fulfill',
              reservation.id,
              targetFulfilled,
            ].join(':'),

          correlationId:
            reservation.id,

          postedByPersonId:
            dto.fulfilledByPersonId,

          remarks:
            this.optionalText(
              dto.remarks,
            ) ??
            reservation.remarks,

          metadata: {
            reservationId:
              reservation.id,

            fulfillmentTarget:
              targetFulfilled,

            fulfillmentDelta:
              delta,

            reservationSourceType:
              reservation.sourceType,

            reservationSourceId:
              reservation.sourceId,
          },
        });
    }

    const fullyClosed =
      this.roundQuantity(
        targetFulfilled +
        reservation
          .releasedQuantity,
      ) === reservation.quantity;

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateReservation(
          reservation.id,
          {
            fulfilledQuantity:
              targetFulfilled,

            releasedQuantity:
              reservation
                .releasedQuantity,

            status:
              fullyClosed
                ? InventoryReservationStatus
                    .FULFILLED
                : InventoryReservationStatus
                    .PARTIALLY_FULFILLED,

            fulfilledByPersonId:
              dto.fulfilledByPersonId,

            fulfilledAt:
              fullyClosed
                ? now
                : undefined,

            remarks:
              this.optionalText(
                dto.remarks,
              ),

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory stock reservation not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.stock.reservation.fulfilled',
      updated.id,
      {
        reservationId:
          updated.id,

        reservationNumber:
          updated.reservationNumber,

        itemId:
          updated.itemId,

        storeId:
          updated.storeId,

        fulfilledQuantity:
          updated.fulfilledQuantity,

        status:
          updated.status,

        actorPersonId:
          dto.fulfilledByPersonId,
      },
    );

    return updated;
  }

  async expireReservation(
    id: string,
    dto:
      ExpireStockReservationDto = {},
  ) {
    const reservation =
      await this.getReservation(id);

    this.requireOpenReservation(
      reservation,
      'expired',
    );

    if (
      reservation.expiresAt &&
      reservation.expiresAt.getTime() >
        Date.now()
    ) {
      throw new BadRequestException(
        'Inventory reservation has not yet expired',
      );
    }

    const remaining =
      this.roundQuantity(
        reservation.quantity -
        reservation
          .fulfilledQuantity -
        reservation
          .releasedQuantity,
      );

    if (remaining <= 0) {
      throw new BadRequestException(
        'Inventory reservation has no remaining quantity to expire',
      );
    }

    await this
      .stockLedgerRepository
      .postMovement({
        movementType:
          InventoryStockMovementType
            .RESERVATION_RELEASE,

        itemId:
          reservation.itemId,

        storeId:
          reservation.storeId,

        binLocationId:
          reservation
            .binLocationId,

        batchId:
          reservation
            .batchId,

        quantityDelta:
          0,

        reservedQuantityDelta:
          -remaining,

        sourceType:
          'inventory.stock_reservation',

        sourceId:
          reservation.id,

        referenceNumber:
          reservation
            .reservationNumber,

        idempotencyKey:
          [
            'inventory-reservation',
            'expire',
            reservation.id,
          ].join(':'),

        correlationId:
          reservation.id,

        postedByPersonId:
          dto.expiredByPersonId,

        remarks:
          this.optionalText(
            dto.remarks,
          ) ??
          'Reservation expired',

        metadata: {
          reservationId:
            reservation.id,

          batchId:
            reservation.batchId,

          expiredQuantity:
            remaining,
        },
      });

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateReservation(
          reservation.id,
          {
            fulfilledQuantity:
              reservation
                .fulfilledQuantity,

            releasedQuantity:
              this.roundQuantity(
                reservation
                  .releasedQuantity +
                remaining,
              ),

            status:
              InventoryReservationStatus
                .EXPIRED,

            releasedByPersonId:
              dto.expiredByPersonId,

            releasedAt:
              now,

            remarks:
              this.optionalText(
                dto.remarks,
              ),

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory stock reservation not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.stock.reservation.expired',
      updated.id,
      {
        reservationId:
          updated.id,

        reservationNumber:
          updated.reservationNumber,

        itemId:
          updated.itemId,

        storeId:
          updated.storeId,

        batchId:
          updated.batchId,

        expiredQuantity:
          remaining,

        actorPersonId:
          dto.expiredByPersonId,
      },
    );

    return updated;
  }

  async expireDueReservations(
    asOf =
      new Date(),
  ) {
    const reservations =
      await this
        .stockLedgerRepository
        .listExpiredReservations(
          asOf,
        );

    const results = [];

    for (
      const reservation
      of reservations
    ) {
      results.push(
        await this
          .expireReservation(
            reservation.id,
            {
              remarks:
                'Automatically expired',
            },
          ),
      );
    }

    return results;
  }

  private requireOpenReservation(
    reservation:
      InventoryStockReservation,
    operation: string,
  ) {
    if (
      ![
        InventoryReservationStatus
          .ACTIVE,
        InventoryReservationStatus
          .PARTIALLY_FULFILLED,
      ].includes(
        reservation.status,
      )
    ) {
      throw new BadRequestException(
        `Inventory reservation cannot be ${operation} from status ${reservation.status}`,
      );
    }
  }

  private requireReservationStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryReservationStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryReservationStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Inventory reservation status: ${value}`,
      );
    }

    return normalized;
  }

  private requirePositiveQuantity(
    value: number,
    field: string,
  ) {
    const quantity =
      Number(value);

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <= 0
    ) {
      throw new BadRequestException(
        `${field} must be greater than zero`,
      );
    }

    return this.roundQuantity(
      quantity,
    );
  }

  private requireDate(
    value: string,
    field: string,
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid date`,
      );
    }

    return date;
  }

  private reservationNumber(
    date: Date,
    id: string,
  ) {
    return [
      'RSV',
      date
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, ''),
      id
        .replace(/-/g, '')
        .slice(0, 10)
        .toUpperCase(),
    ].join('-');
  }

  private optionalText(
    value?: string,
  ) {
    const normalized =
      value?.trim();

    return normalized ||
      undefined;
  }

  private roundQuantity(
    value: number,
  ) {
    return Number(
      Number(value).toFixed(6),
    );
  }

  private async publishAndAudit(
    eventType: string,
    reservationId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.stock_reservation',

      entityId:
        reservationId,

      ...payload,
    };

    await this.eventBus.publish(
      eventType,
      'core.inventory',
      fullPayload,
    );

    await this.auditService.record(
      eventType,
      'core.inventory',
      fullPayload,
    );
  }
}
