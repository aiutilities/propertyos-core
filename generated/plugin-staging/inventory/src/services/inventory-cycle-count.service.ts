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
  CancelCycleCountDto,
  CompleteCycleCountDto,
  CreateCycleCountDto,
  PostCycleCountDto,
  RecordCycleCountDto,
  StartCycleCountDto,
} from '../dto';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryCycleCount,
  InventoryCycleCountItem,
  InventoryCycleCountScopeType,
  InventoryCycleCountStatus,
  InventoryStockMovementType,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

@Injectable()
export class InventoryCycleCountService {
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

  async createCycleCount(
    dto: CreateCycleCountDto,
  ) {
    const store =
      await this.inventoryService
        .getStore(dto.storeId);

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

    const scopeType =
      dto.scopeType ??
      InventoryCycleCountScopeType
        .STORE;

    await this.validateScope(
      scopeType,
      dto.storeId,
      dto.binLocationId,
      dto.itemId,
    );

    const countDate =
      this.requireDate(
        dto.countDate,
        'countDate',
      );

    const balances =
      await this.inventoryService
        .listStockBalances({
          storeId:
            dto.storeId,

          binLocationId:
            scopeType ===
            InventoryCycleCountScopeType
              .BIN
              ? dto.binLocationId
              : undefined,

          itemId:
            scopeType ===
            InventoryCycleCountScopeType
              .ITEM
              ? dto.itemId
              : undefined,
        });

    if (!balances.length) {
      throw new BadRequestException(
        'No Inventory stock balances exist for the selected Cycle Count scope',
      );
    }

    const now =
      new Date();

    const cycleCountId =
      randomUUID();

    const cycleCount:
      InventoryCycleCount = {
        id:
          cycleCountId,

        countNumber:
          this.countNumber(
            now,
            cycleCountId,
          ),

        propertyId:
          dto.propertyId,

        storeId:
          dto.storeId,

        status:
          InventoryCycleCountStatus
            .DRAFT,

        countDate,

        blindCount:
          dto.blindCount ??
          true,

        freezeStock:
          dto.freezeStock ??
          false,

        scopeType,

        notes:
          this.optionalText(
            dto.notes,
          ),

        createdByPersonId:
          dto.createdByPersonId,

        metadata: {
          ...(dto.metadata ?? {}),

          scopeBinLocationId:
            dto.binLocationId,

          scopeItemId:
            dto.itemId,
        },

        createdAt:
          now,

        updatedAt:
          now,
      };

    const items:
      InventoryCycleCountItem[] =
      balances.map(
        (balance) => ({
          id:
            randomUUID(),

          cycleCountId,

          itemId:
            balance.itemId,

          binLocationId:
            balance
              .binLocationId,

          systemQuantity:
            this.roundQuantity(
              balance
                .quantityOnHand,
            ),

          averageUnitCost:
            this.roundMoney(
              balance
                .averageUnitCost,
            ),

          metadata: {
            reservedQuantity:
              balance
                .reservedQuantity,

            availableQuantity:
              balance
                .availableQuantity,

            balanceId:
              balance.id,
          },

          createdAt:
            now,

          updatedAt:
            now,
        }),
      );

    const created =
      await this
        .stockLedgerRepository
        .createCycleCount(
          cycleCount,
          items,
        );

    await this.publishAndAudit(
      'inventory.cycle_count.created',
      cycleCount.id,
      {
        cycleCountId:
          cycleCount.id,

        countNumber:
          cycleCount.countNumber,

        propertyId:
          cycleCount.propertyId,

        storeId:
          cycleCount.storeId,

        scopeType:
          cycleCount.scopeType,

        itemCount:
          items.length,

        blindCount:
          cycleCount.blindCount,

        freezeStock:
          cycleCount.freezeStock,

        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async getCycleCount(
    id: string,
  ) {
    const result =
      await this
        .stockLedgerRepository
        .findCycleCountById(id);

    if (!result) {
      throw new NotFoundException(
        `Inventory Cycle Count not found: ${id}`,
      );
    }

    return result;
  }

  listCycleCounts(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    return this
      .stockLedgerRepository
      .listCycleCounts({
        propertyId:
          filters.propertyId,

        storeId:
          filters.storeId,

        status:
          filters.status
            ? this.requireStatus(
                filters.status,
              )
            : undefined,

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

  async startCycleCount(
    id: string,
    dto: StartCycleCountDto,
  ) {
    const details =
      await this.getCycleCount(id);

    if (
      details.cycleCount.status !==
      InventoryCycleCountStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Cycle Counts can be started; current status is ${details.cycleCount.status}`,
      );
    }

    if (!details.items.length) {
      throw new BadRequestException(
        'Cycle Count has no stock items',
      );
    }

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateCycleCountStatus(
          id,
          {
            status:
              InventoryCycleCountStatus
                .IN_PROGRESS,

            startedByPersonId:
              dto.startedByPersonId,

            startedAt:
              now,

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory Cycle Count not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.cycle_count.started',
      id,
      {
        cycleCountId:
          id,

        countNumber:
          updated.countNumber,

        propertyId:
          updated.propertyId,

        storeId:
          updated.storeId,

        actorPersonId:
          dto.startedByPersonId,
      },
    );

    return this.getCycleCount(id);
  }

  async recordCount(
    id: string,
    dto: RecordCycleCountDto,
  ) {
    const details =
      await this.getCycleCount(id);

    if (
      details.cycleCount.status !==
      InventoryCycleCountStatus
        .IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Counts can only be recorded while the Cycle Count is IN_PROGRESS; current status is ${details.cycleCount.status}`,
      );
    }

    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one Cycle Count item is required',
      );
    }

    const itemMap =
      new Map(
        details.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const requestIds =
      new Set<string>();

    for (
      const requested
      of dto.items
    ) {
      if (
        requestIds.has(
          requested
            .cycleCountItemId,
        )
      ) {
        throw new BadRequestException(
          'Duplicate Cycle Count item in request',
        );
      }

      requestIds.add(
        requested
          .cycleCountItemId,
      );

      const item =
        itemMap.get(
          requested
            .cycleCountItemId,
        );

      if (!item) {
        throw new BadRequestException(
          `Cycle Count item does not belong to this count: ${requested.cycleCountItemId}`,
        );
      }

      const countedQuantity =
        Number(
          requested
            .countedQuantity,
        );

      if (
        !Number.isFinite(
          countedQuantity,
        ) ||
        countedQuantity < 0
      ) {
        throw new BadRequestException(
          'countedQuantity must be zero or greater',
        );
      }

      const roundedCounted =
        this.roundQuantity(
          countedQuantity,
        );

      const varianceQuantity =
        this.roundQuantity(
          roundedCounted -
          item.systemQuantity,
        );

      const varianceValue =
        this.roundMoney(
          varianceQuantity *
          item.averageUnitCost,
        );

      const now =
        new Date();

      const updated =
        await this
          .stockLedgerRepository
          .updateCycleCountItem(
            item.id,
            {
              countedQuantity:
                roundedCounted,

              varianceQuantity,

              varianceValue,

              countedByPersonId:
                dto.countedByPersonId,

              countedAt:
                now,

              remarks:
                this.optionalText(
                  requested.remarks,
                ),

              updatedAt:
                now,
            },
          );

      if (!updated) {
        throw new NotFoundException(
          `Inventory Cycle Count item not found: ${item.id}`,
        );
      }
    }

    await this.publishAndAudit(
      'inventory.cycle_count.recorded',
      id,
      {
        cycleCountId:
          id,

        countNumber:
          details.cycleCount
            .countNumber,

        recordedItemCount:
          dto.items.length,

        actorPersonId:
          dto.countedByPersonId,
      },
    );

    return this.getCycleCount(id);
  }

  async completeCycleCount(
    id: string,
    dto: CompleteCycleCountDto,
  ) {
    const details =
      await this.getCycleCount(id);

    if (
      details.cycleCount.status !==
      InventoryCycleCountStatus
        .IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Only IN_PROGRESS Cycle Counts can be completed; current status is ${details.cycleCount.status}`,
      );
    }

    const uncountedItems =
      details.items.filter(
        (item) =>
          item.countedQuantity ===
          undefined,
      );

    if (uncountedItems.length) {
      throw new BadRequestException(
        `${uncountedItems.length} Cycle Count item(s) have not been counted`,
      );
    }

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateCycleCountStatus(
          id,
          {
            status:
              InventoryCycleCountStatus
                .COMPLETED,

            completedByPersonId:
              dto.completedByPersonId,

            completedAt:
              now,

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory Cycle Count not found: ${id}`,
      );
    }

    const varianceItems =
      details.items.filter(
        (item) =>
          item.varianceQuantity !==
            undefined &&
          item.varianceQuantity !==
            0,
      );

    await this.publishAndAudit(
      'inventory.cycle_count.completed',
      id,
      {
        cycleCountId:
          id,

        countNumber:
          updated.countNumber,

        itemCount:
          details.items.length,

        varianceItemCount:
          varianceItems.length,

        totalVarianceValue:
          this.roundMoney(
            varianceItems.reduce(
              (
                total,
                item,
              ) =>
                total +
                (
                  item.varianceValue ??
                  0
                ),
              0,
            ),
          ),

        actorPersonId:
          dto.completedByPersonId,
      },
    );

    return this.getCycleCount(id);
  }

  async postCycleCount(
    id: string,
    dto: PostCycleCountDto,
  ) {
    const details =
      await this.getCycleCount(id);

    if (
      details.cycleCount.status !==
      InventoryCycleCountStatus
        .COMPLETED
    ) {
      throw new BadRequestException(
        `Only COMPLETED Cycle Counts can be posted; current status is ${details.cycleCount.status}`,
      );
    }

    for (
      const item
      of details.items
    ) {
      const variance =
        item.varianceQuantity ??
        0;

      if (variance === 0) {
        continue;
      }

      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            variance > 0
              ? InventoryStockMovementType
                  .ADJUSTMENT_IN
              : InventoryStockMovementType
                  .ADJUSTMENT_OUT,

          itemId:
            item.itemId,

          storeId:
            details.cycleCount
              .storeId,

          binLocationId:
            item.binLocationId,

          quantityDelta:
            variance,

          unitCost:
            item.averageUnitCost,

          sourceType:
            'inventory.cycle_count',

          sourceId:
            details.cycleCount.id,

          sourceLineId:
            item.id,

          referenceNumber:
            details.cycleCount
              .countNumber,

          idempotencyKey:
            [
              'inventory-cycle-count',
              details.cycleCount.id,
              item.id,
            ].join(':'),

          correlationId:
            details.cycleCount.id,

          movementDate:
            details.cycleCount
              .countDate,

          postedByPersonId:
            dto.postedByPersonId,

          remarks:
            item.remarks ??
            details.cycleCount.notes,

          metadata: {
            cycleCountId:
              details.cycleCount.id,

            countNumber:
              details.cycleCount
                .countNumber,

            propertyId:
              details.cycleCount
                .propertyId,

            storeId:
              details.cycleCount
                .storeId,

            cycleCountItemId:
              item.id,

            systemQuantity:
              item.systemQuantity,

            countedQuantity:
              item.countedQuantity,

            varianceQuantity:
              variance,

            varianceValue:
              item.varianceValue,

            blindCount:
              details.cycleCount
                .blindCount,
          },
        });
    }

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateCycleCountStatus(
          id,
          {
            status:
              InventoryCycleCountStatus
                .POSTED,

            postedByPersonId:
              dto.postedByPersonId,

            postedAt:
              now,

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory Cycle Count not found: ${id}`,
      );
    }

    const postedVarianceItems =
      details.items.filter(
        (item) =>
          (
            item.varianceQuantity ??
            0
          ) !== 0,
      );

    await this.publishAndAudit(
      'inventory.cycle_count.posted',
      id,
      {
        cycleCountId:
          id,

        countNumber:
          updated.countNumber,

        propertyId:
          updated.propertyId,

        storeId:
          updated.storeId,

        postedVarianceItemCount:
          postedVarianceItems.length,

        actorPersonId:
          dto.postedByPersonId,
      },
    );

    return this.getCycleCount(id);
  }

  async cancelCycleCount(
    id: string,
    dto: CancelCycleCountDto,
  ) {
    const details =
      await this.getCycleCount(id);

    if (
      ![
        InventoryCycleCountStatus
          .DRAFT,
        InventoryCycleCountStatus
          .IN_PROGRESS,
        InventoryCycleCountStatus
          .COMPLETED,
      ].includes(
        details.cycleCount.status,
      )
    ) {
      throw new BadRequestException(
        `Cycle Count cannot be cancelled from status ${details.cycleCount.status}`,
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

    const now =
      new Date();

    const updated =
      await this
        .stockLedgerRepository
        .updateCycleCountStatus(
          id,
          {
            status:
              InventoryCycleCountStatus
                .CANCELLED,

            cancelledByPersonId:
              dto.cancelledByPersonId,

            cancelledAt:
              now,

            cancellationReason:
              dto.cancellationReason
                .trim(),

            updatedAt:
              now,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory Cycle Count not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.cycle_count.cancelled',
      id,
      {
        cycleCountId:
          id,

        countNumber:
          updated.countNumber,

        propertyId:
          updated.propertyId,

        storeId:
          updated.storeId,

        cancellationReason:
          updated
            .cancellationReason,

        actorPersonId:
          dto.cancelledByPersonId,
      },
    );

    return this.getCycleCount(id);
  }

  private async validateScope(
    scopeType:
      InventoryCycleCountScopeType,
    storeId: string,
    binLocationId?: string,
    itemId?: string,
  ) {
    if (
      scopeType ===
      InventoryCycleCountScopeType
        .BIN
    ) {
      if (!binLocationId) {
        throw new BadRequestException(
          'binLocationId is required for BIN Cycle Counts',
        );
      }

      const bin =
        await this.inventoryService
          .getBinLocation(
            binLocationId,
          );

      if (
        !bin.isActive ||
        bin.storeId !== storeId
      ) {
        throw new BadRequestException(
          'The Cycle Count bin is inactive or does not belong to the selected store',
        );
      }
    }

    if (
      scopeType ===
      InventoryCycleCountScopeType
        .ITEM
    ) {
      if (!itemId) {
        throw new BadRequestException(
          'itemId is required for ITEM Cycle Counts',
        );
      }

      const item =
        await this.inventoryService
          .getItem(itemId);

      if (!item.isActive) {
        throw new BadRequestException(
          `Inventory item is inactive: ${item.id}`,
        );
      }
    }
  }

  private requireStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryCycleCountStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryCycleCountStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Inventory Cycle Count status: ${value}`,
      );
    }

    return normalized;
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

  private countNumber(
    date: Date,
    id: string,
  ) {
    return [
      'CNT',
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

  private roundMoney(
    value: number,
  ) {
    return Number(
      Number(value).toFixed(6),
    );
  }

  private async publishAndAudit(
    eventType: string,
    cycleCountId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.cycle_count',

      entityId:
        cycleCountId,

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
