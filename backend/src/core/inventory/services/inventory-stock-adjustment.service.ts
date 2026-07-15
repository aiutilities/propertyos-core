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
} from '../../audit/audit.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  CancelStockAdjustmentDto,
  CreateStockAdjustmentDto,
  PostStockAdjustmentDto,
} from '../dto';

import {
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryService,
} from './inventory.service';

import {
  InventoryAdjustmentStatus,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockMovementType,
} from '../types/inventory.types';

@Injectable()
export class InventoryStockAdjustmentService {
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

  async createAdjustment(
    dto: CreateStockAdjustmentDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one adjustment item is required',
      );
    }

    if (!dto.reasonCode?.trim()) {
      throw new BadRequestException(
        'reasonCode is required',
      );
    }

    const store =
      await this.inventoryService
        .getStore(
          dto.storeId,
        );

    if (!store.isActive) {
      throw new BadRequestException(
        `Inventory store is inactive: ${store.id}`,
      );
    }

    if (
      store.propertyId !==
      dto.propertyId
    ) {
      throw new BadRequestException(
        'The Inventory store does not belong to the selected property',
      );
    }

    const adjustmentDate =
      this.requireDate(
        dto.adjustmentDate,
        'adjustmentDate',
      );

    const now =
      new Date();

    const adjustmentId =
      randomUUID();

    const duplicateKeys =
      new Set<string>();

    const items:
      InventoryStockAdjustmentItem[] =
      [];

    for (
      const dtoItem
      of dto.items
    ) {
      const quantityDelta =
        Number(
          dtoItem.quantityDelta,
        );

      const unitCost =
        Number(
          dtoItem.unitCost,
        );

      if (
        !Number.isFinite(
          quantityDelta,
        ) ||
        quantityDelta === 0
      ) {
        throw new BadRequestException(
          'Each adjustment quantityDelta must be a non-zero number',
        );
      }

      if (
        !Number.isFinite(
          unitCost,
        ) ||
        unitCost < 0
      ) {
        throw new BadRequestException(
          'Each adjustment unitCost must be zero or greater',
        );
      }

      const item =
        await this.inventoryService
          .getItem(
            dtoItem.itemId,
          );

      if (!item.isActive) {
        throw new BadRequestException(
          `Inventory item is inactive: ${item.id}`,
        );
      }

      if (dtoItem.binLocationId) {
        const bin =
          await this.inventoryService
            .getBinLocation(
              dtoItem.binLocationId,
            );

        if (
          bin.storeId !==
          dto.storeId
        ) {
          throw new BadRequestException(
            `Inventory bin does not belong to the selected store: ${bin.id}`,
          );
        }

        if (!bin.isActive) {
          throw new BadRequestException(
            `Inventory bin is inactive: ${bin.id}`,
          );
        }
      }

      const duplicateKey = [
        dtoItem.itemId,
        dtoItem.binLocationId ??
          'STORE',
      ].join(':');

      if (
        duplicateKeys.has(
          duplicateKey,
        )
      ) {
        throw new BadRequestException(
          'Duplicate Inventory adjustment item and bin combination',
        );
      }

      duplicateKeys.add(
        duplicateKey,
      );

      items.push({
        id:
          randomUUID(),

        adjustmentId,

        itemId:
          dtoItem.itemId,

        binLocationId:
          dtoItem.binLocationId,

        quantityDelta,

        unitCost,

        remarks:
          this.optionalText(
            dtoItem.remarks,
          ),

        createdAt:
          now,
      });
    }

    const adjustment:
      InventoryStockAdjustment = {
        id:
          adjustmentId,

        adjustmentNumber:
          this.adjustmentNumber(
            now,
            adjustmentId,
          ),

        propertyId:
          dto.propertyId,

        storeId:
          dto.storeId,

        status:
          InventoryAdjustmentStatus
            .DRAFT,

        adjustmentDate,

        reasonCode:
          dto.reasonCode
            .trim()
            .toUpperCase(),

        reasonDescription:
          this.optionalText(
            dto.reasonDescription,
          ),

        createdByPersonId:
          dto.createdByPersonId,

        remarks:
          this.optionalText(
            dto.remarks,
          ),

        metadata: {},

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this
        .stockLedgerRepository
        .createAdjustment(
          adjustment,
          items,
        );

    await this.publishAndAudit(
      'inventory.stock.adjustment.created',
      created.adjustment.id,
      {
        adjustmentId:
          created.adjustment.id,

        adjustmentNumber:
          created.adjustment
            .adjustmentNumber,

        propertyId:
          created.adjustment
            .propertyId,

        storeId:
          created.adjustment
            .storeId,

        reasonCode:
          created.adjustment
            .reasonCode,

        itemCount:
          created.items.length,

        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async getAdjustment(
    id: string,
  ) {
    const adjustment =
      await this
        .stockLedgerRepository
        .findAdjustmentById(
          id,
        );

    if (!adjustment) {
      throw new NotFoundException(
        `Inventory stock adjustment not found: ${id}`,
      );
    }

    return adjustment;
  }

  listAdjustments(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const status =
      filters.status
        ? this.requireAdjustmentStatus(
            filters.status,
          )
        : undefined;

    return this
      .stockLedgerRepository
      .listAdjustments({
        propertyId:
          filters.propertyId,

        storeId:
          filters.storeId,

        status,

        dateFrom:
          filters.dateFrom
            ? this.requireDate(
                filters.dateFrom,
                'dateFrom',
              )
            : undefined,

        dateTo:
          filters.dateTo
            ? this.requireDate(
                filters.dateTo,
                'dateTo',
              )
            : undefined,
      });
  }

  async postAdjustment(
    id: string,
    dto: PostStockAdjustmentDto,
  ) {
    const details =
      await this.getAdjustment(
        id,
      );

    if (
      details.adjustment.status !==
      InventoryAdjustmentStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Inventory adjustments can be posted; current status is ${details.adjustment.status}`,
      );
    }

    if (!details.items.length) {
      throw new BadRequestException(
        'Inventory adjustment has no items',
      );
    }

    for (
      const item
      of details.items
    ) {
      const movementType =
        item.quantityDelta > 0
          ? InventoryStockMovementType
              .ADJUSTMENT_IN
          : InventoryStockMovementType
              .ADJUSTMENT_OUT;

      await this
        .stockLedgerRepository
        .postMovement({
          movementType,

          itemId:
            item.itemId,

          storeId:
            details.adjustment
              .storeId,

          binLocationId:
            item.binLocationId,

          quantityDelta:
            item.quantityDelta,

          unitCost:
            item.unitCost,

          sourceType:
            'inventory.stock_adjustment',

          sourceId:
            details.adjustment.id,

          sourceLineId:
            item.id,

          referenceNumber:
            details.adjustment
              .adjustmentNumber,

          idempotencyKey:
            [
              'inventory-adjustment',
              details.adjustment.id,
              item.id,
            ].join(':'),

          correlationId:
            details.adjustment.id,

          movementDate:
            details.adjustment
              .adjustmentDate,

          postedByPersonId:
            dto.postedByPersonId,

          remarks:
            item.remarks ??
            details.adjustment
              .remarks,

          metadata: {
            adjustmentId:
              details.adjustment.id,

            adjustmentNumber:
              details.adjustment
                .adjustmentNumber,

            propertyId:
              details.adjustment
                .propertyId,

            storeId:
              details.adjustment
                .storeId,

            reasonCode:
              details.adjustment
                .reasonCode,

            reasonDescription:
              details.adjustment
                .reasonDescription,

            adjustmentItemId:
              item.id,
          },
        });
    }

    const postedAt =
      new Date();

    const posted =
      await this
        .stockLedgerRepository
        .updateAdjustmentStatus(
          id,
          {
            status:
              InventoryAdjustmentStatus
                .POSTED,

            postedByPersonId:
              dto.postedByPersonId,

            postedAt,

            updatedAt:
              postedAt,
          },
        );

    if (!posted) {
      throw new NotFoundException(
        `Inventory stock adjustment not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .STOCK_ADJUSTED,
      posted.id,
      {
        adjustmentId:
          posted.id,

        adjustmentNumber:
          posted.adjustmentNumber,

        propertyId:
          posted.propertyId,

        storeId:
          posted.storeId,

        reasonCode:
          posted.reasonCode,

        itemCount:
          details.items.length,

        actorPersonId:
          dto.postedByPersonId,
      },
    );

    return this.getAdjustment(
      id,
    );
  }

  async cancelAdjustment(
    id: string,
    dto: CancelStockAdjustmentDto,
  ) {
    const details =
      await this.getAdjustment(
        id,
      );

    if (
      details.adjustment.status !==
      InventoryAdjustmentStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Inventory adjustments can be cancelled; current status is ${details.adjustment.status}`,
      );
    }

    if (
      !dto.cancellationReason
        ?.trim()
    ) {
      throw new BadRequestException(
        'cancellationReason is required',
      );
    }

    const cancelledAt =
      new Date();

    const cancelled =
      await this
        .stockLedgerRepository
        .updateAdjustmentStatus(
          id,
          {
            status:
              InventoryAdjustmentStatus
                .CANCELLED,

            cancelledByPersonId:
              dto.cancelledByPersonId,

            cancelledAt,

            cancellationReason:
              dto.cancellationReason
                .trim(),

            updatedAt:
              cancelledAt,
          },
        );

    if (!cancelled) {
      throw new NotFoundException(
        `Inventory stock adjustment not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.stock.adjustment.cancelled',
      cancelled.id,
      {
        adjustmentId:
          cancelled.id,

        adjustmentNumber:
          cancelled
            .adjustmentNumber,

        propertyId:
          cancelled.propertyId,

        storeId:
          cancelled.storeId,

        cancellationReason:
          cancelled
            .cancellationReason,

        actorPersonId:
          dto.cancelledByPersonId,
      },
    );

    return this.getAdjustment(
      id,
    );
  }

  private adjustmentNumber(
    date: Date,
    id: string,
  ) {
    return [
      'ADJ',
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

  private requireAdjustmentStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryAdjustmentStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryAdjustmentStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Inventory adjustment status: ${value}`,
      );
    }

    return normalized;
  }

  private optionalText(
    value?: string,
  ) {
    const normalized =
      value?.trim();

    return normalized ||
      undefined;
  }

  private async publishAndAudit(
    eventType: string,
    adjustmentId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.stock_adjustment',

      entityId:
        adjustmentId,

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
