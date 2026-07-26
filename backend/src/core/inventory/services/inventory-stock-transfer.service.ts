import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

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
  CancelStockTransferDto,
  CreateStockTransferDto,
  DispatchStockTransferDto,
  ReceiveStockTransferDto,
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
  InventoryStockMovementType,
  InventoryStockTransfer,
  InventoryStockTransferItem,
  InventoryTransferStatus,
} from '../types/inventory.types';

@Injectable()
export class InventoryStockTransferService {
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

    private readonly postingMetrics:
      InventoryPostingMetricsService,

  ) {}

  async createTransfer(
    dto: CreateStockTransferDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one transfer item is required',
      );
    }

    if (
      dto.sourceStoreId ===
      dto.destinationStoreId
    ) {
      throw new BadRequestException(
        'Source and destination Inventory stores must be different',
      );
    }

    const [
      sourceStore,
      destinationStore,
    ] = await Promise.all([
      this.inventoryService
        .getStore(
          dto.sourceStoreId,
        ),

      this.inventoryService
        .getStore(
          dto.destinationStoreId,
        ),
    ]);

    if (
      !sourceStore.isActive ||
      !destinationStore.isActive
    ) {
      throw new BadRequestException(
        'Both Inventory stores must be active',
      );
    }

    if (
      sourceStore.propertyId !==
        dto.propertyId ||
      destinationStore.propertyId !==
        dto.propertyId
    ) {
      throw new BadRequestException(
        'Both Inventory stores must belong to the selected property',
      );
    }

    const transferDate =
      this.requireDate(
        dto.transferDate,
        'transferDate',
      );

    const transferId =
      randomUUID();

    const now =
      new Date();

    const duplicateKeys =
      new Set<string>();

    const items:
      InventoryStockTransferItem[] =
      [];

    for (
      const dtoItem
      of dto.items
    ) {
      const quantity =
        Number(
          dtoItem.quantity,
        );

      const unitCost =
        Number(
          dtoItem.unitCost,
        );

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity <= 0
      ) {
        throw new BadRequestException(
          'Each transfer quantity must be greater than zero',
        );
      }

      if (
        !Number.isFinite(
          unitCost,
        ) ||
        unitCost < 0
      ) {
        throw new BadRequestException(
          'Each transfer unitCost must be zero or greater',
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

      if (
        dtoItem
          .sourceBinLocationId
      ) {
        await this.requireBinForStore(
          dtoItem
            .sourceBinLocationId,
          dto.sourceStoreId,
          'source',
        );
      }

      if (
        dtoItem
          .destinationBinLocationId
      ) {
        await this.requireBinForStore(
          dtoItem
            .destinationBinLocationId,
          dto.destinationStoreId,
          'destination',
        );
      }

      const duplicateKey = [
        dtoItem.itemId,
        dtoItem
          .sourceBinLocationId ??
          'STORE',
        dtoItem
          .destinationBinLocationId ??
          'STORE',
      ].join(':');

      if (
        duplicateKeys.has(
          duplicateKey,
        )
      ) {
        throw new BadRequestException(
          'Duplicate Inventory transfer item and bin combination',
        );
      }

      duplicateKeys.add(
        duplicateKey,
      );

      items.push({
        id:
          randomUUID(),

        transferId,

        itemId:
          dtoItem.itemId,

        sourceBinLocationId:
          dtoItem
            .sourceBinLocationId,

        destinationBinLocationId:
          dtoItem
            .destinationBinLocationId,

        quantity,

        dispatchedQuantity:
          0,

        receivedQuantity:
          0,

        unitCost,

        remarks:
          this.optionalText(
            dtoItem.remarks,
          ),

        createdAt:
          now,

        updatedAt:
          now,
      });
    }

    const transfer:
      InventoryStockTransfer = {
        id:
          transferId,

        transferNumber:
          this.transferNumber(
            now,
            transferId,
          ),

        propertyId:
          dto.propertyId,

        sourceStoreId:
          dto.sourceStoreId,

        destinationStoreId:
          dto.destinationStoreId,

        status:
          InventoryTransferStatus
            .DRAFT,

        transferDate,

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
        .createTransfer(
          transfer,
          items,
        );

    await this.publishAndAudit(
      'inventory.stock.transfer.created',
      transferId,
      {
        transferId,

        transferNumber:
          transfer.transferNumber,

        propertyId:
          transfer.propertyId,

        sourceStoreId:
          transfer.sourceStoreId,

        destinationStoreId:
          transfer.destinationStoreId,

        itemCount:
          items.length,

        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async getTransfer(
    id: string,
  ) {
    const transfer =
      await this
        .stockLedgerRepository
        .findTransferById(
          id,
        );

    if (!transfer) {
      throw new NotFoundException(
        `Inventory stock transfer not found: ${id}`,
      );
    }

    return transfer;
  }

  listTransfers(
    filters: {
      propertyId?: string;
      sourceStoreId?: string;
      destinationStoreId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const status =
      filters.status
        ? this.requireTransferStatus(
            filters.status,
          )
        : undefined;

    return this
      .stockLedgerRepository
      .listTransfers({
        propertyId:
          filters.propertyId,

        sourceStoreId:
          filters.sourceStoreId,

        destinationStoreId:
          filters
            .destinationStoreId,

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

  async dispatchTransfer(
    id: string,
    dto: DispatchStockTransferDto,
  ) {
    return this.postingMetrics.observe(
      'transfer_dispatch',
      async () => {
    const details =
      await this.getTransfer(
        id,
      );

    if (
      ![
        InventoryTransferStatus
          .DRAFT,
        InventoryTransferStatus
          .DISPATCHED,
      ].includes(
        details.transfer.status,
      )
    ) {
      throw new BadRequestException(
        `Transfer cannot be dispatched from status ${details.transfer.status}`,
      );
    }

    const requestMap =
      this.requireUniqueTargets(
        dto.items,
        'dispatch',
      );

    const itemMap =
      new Map(
        details.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    for (
      const requested
      of dto.items
    ) {
      const item =
        itemMap.get(
          requested
            .transferItemId,
        );

      if (!item) {
        throw new BadRequestException(
          `Transfer item does not belong to this transfer: ${requested.transferItemId}`,
        );
      }

      const targetQuantity =
        Number(
          requested.quantity,
        );

      if (
        !Number.isFinite(
          targetQuantity,
        ) ||
        targetQuantity <= 0 ||
        targetQuantity >
          item.quantity
      ) {
        throw new BadRequestException(
          `Dispatch target must be greater than zero and no more than ${item.quantity}`,
        );
      }

      if (
        targetQuantity <
        item.dispatchedQuantity
      ) {
        throw new BadRequestException(
          'Dispatch target cannot be lower than the quantity already dispatched',
        );
      }

      const delta =
        this.roundQuantity(
          targetQuantity -
          item.dispatchedQuantity,
        );

      if (delta === 0) {
        continue;
      }

      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            InventoryStockMovementType
              .TRANSFER_OUT,

          itemId:
            item.itemId,

          storeId:
            details.transfer
              .sourceStoreId,

          binLocationId:
            item
              .sourceBinLocationId,

          quantityDelta:
            -delta,

          unitCost:
            item.unitCost,

          sourceType:
            'inventory.stock_transfer',

          sourceId:
            details.transfer.id,

          sourceLineId:
            item.id,

          referenceNumber:
            details.transfer
              .transferNumber,

          idempotencyKey:
            [
              'inventory-transfer',
              'dispatch',
              details.transfer.id,
              item.id,
              targetQuantity,
            ].join(':'),

          correlationId:
            details.transfer.id,

          movementDate:
            details.transfer
              .transferDate,

          postedByPersonId:
            dto.dispatchedByPersonId,

          remarks:
            item.remarks ??
            details.transfer
              .remarks,

          metadata: {
            transferId:
              details.transfer.id,

            transferNumber:
              details.transfer
                .transferNumber,

            propertyId:
              details.transfer
                .propertyId,

            sourceStoreId:
              details.transfer
                .sourceStoreId,

            destinationStoreId:
              details.transfer
                .destinationStoreId,

            transferItemId:
              item.id,

            dispatchedTarget:
              targetQuantity,

            dispatchedDelta:
              delta,
          },
        });

      await this
        .stockLedgerRepository
        .updateTransferItemQuantities(
          item.id,
          {
            dispatchedQuantity:
              targetQuantity,

            receivedQuantity:
              item.receivedQuantity,

            updatedAt:
              new Date(),
          },
        );
    }

    if (
      requestMap.size === 0
    ) {
      throw new BadRequestException(
        'At least one dispatch target is required',
      );
    }

    const refreshed =
      await this.getTransfer(
        id,
      );

    const hasDispatchedStock =
      refreshed.items.some(
        (item) =>
          item.dispatchedQuantity >
          0,
      );

    if (!hasDispatchedStock) {
      throw new BadRequestException(
        'No Inventory quantity was dispatched',
      );
    }

    const now =
      new Date();

    await this
      .stockLedgerRepository
      .updateTransferStatus(
        id,
        {
          status:
            InventoryTransferStatus
              .DISPATCHED,

          dispatchedByPersonId:
            dto.dispatchedByPersonId,

          dispatchedAt:
            refreshed.transfer
              .dispatchedAt ??
            now,

          updatedAt:
            now,
        },
      );

    await this.publishAndAudit(
      'inventory.stock.transfer.dispatched',
      id,
      {
        transferId:
          id,

        transferNumber:
          refreshed.transfer
            .transferNumber,

        propertyId:
          refreshed.transfer
            .propertyId,

        sourceStoreId:
          refreshed.transfer
            .sourceStoreId,

        destinationStoreId:
          refreshed.transfer
            .destinationStoreId,

        actorPersonId:
          dto.dispatchedByPersonId,
      },
    );

    return this.getTransfer(
      id,
    );

      },
    );
}

  async receiveTransfer(
    id: string,
    dto: ReceiveStockTransferDto,
  ) {
    return this.postingMetrics.observe(
      'transfer_receive',
      async () => {
    const details =
      await this.getTransfer(
        id,
      );

    if (
      details.transfer.status !==
      InventoryTransferStatus
        .DISPATCHED
    ) {
      throw new BadRequestException(
        `Only DISPATCHED Inventory transfers can be received; current status is ${details.transfer.status}`,
      );
    }

    this.requireUniqueTargets(
      dto.items,
      'receipt',
    );

    const itemMap =
      new Map(
        details.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    for (
      const requested
      of dto.items
    ) {
      const item =
        itemMap.get(
          requested
            .transferItemId,
        );

      if (!item) {
        throw new BadRequestException(
          `Transfer item does not belong to this transfer: ${requested.transferItemId}`,
        );
      }

      const targetQuantity =
        Number(
          requested.quantity,
        );

      if (
        !Number.isFinite(
          targetQuantity,
        ) ||
        targetQuantity <= 0 ||
        targetQuantity >
          item.dispatchedQuantity
      ) {
        throw new BadRequestException(
          `Receipt target must be greater than zero and no more than the dispatched quantity ${item.dispatchedQuantity}`,
        );
      }

      if (
        targetQuantity <
        item.receivedQuantity
      ) {
        throw new BadRequestException(
          'Receipt target cannot be lower than the quantity already received',
        );
      }

      const delta =
        this.roundQuantity(
          targetQuantity -
          item.receivedQuantity,
        );

      if (delta === 0) {
        continue;
      }

      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            InventoryStockMovementType
              .TRANSFER_IN,

          itemId:
            item.itemId,

          storeId:
            details.transfer
              .destinationStoreId,

          binLocationId:
            item
              .destinationBinLocationId,

          quantityDelta:
            delta,

          unitCost:
            item.unitCost,

          sourceType:
            'inventory.stock_transfer',

          sourceId:
            details.transfer.id,

          sourceLineId:
            item.id,

          referenceNumber:
            details.transfer
              .transferNumber,

          idempotencyKey:
            [
              'inventory-transfer',
              'receive',
              details.transfer.id,
              item.id,
              targetQuantity,
            ].join(':'),

          correlationId:
            details.transfer.id,

          movementDate:
            new Date(),

          postedByPersonId:
            dto.receivedByPersonId,

          remarks:
            item.remarks ??
            details.transfer
              .remarks,

          metadata: {
            transferId:
              details.transfer.id,

            transferNumber:
              details.transfer
                .transferNumber,

            propertyId:
              details.transfer
                .propertyId,

            sourceStoreId:
              details.transfer
                .sourceStoreId,

            destinationStoreId:
              details.transfer
                .destinationStoreId,

            transferItemId:
              item.id,

            receivedTarget:
              targetQuantity,

            receivedDelta:
              delta,
          },
        });

      await this
        .stockLedgerRepository
        .updateTransferItemQuantities(
          item.id,
          {
            dispatchedQuantity:
              item.dispatchedQuantity,

            receivedQuantity:
              targetQuantity,

            updatedAt:
              new Date(),
          },
        );
    }

    const refreshed =
      await this.getTransfer(
        id,
      );

    const allReceived =
      refreshed.items.every(
        (item) =>
          item.receivedQuantity ===
          item.quantity,
      );

    const now =
      new Date();

    await this
      .stockLedgerRepository
      .updateTransferStatus(
        id,
        {
          status:
            allReceived
              ? InventoryTransferStatus
                  .RECEIVED
              : InventoryTransferStatus
                  .DISPATCHED,

          receivedByPersonId:
            dto.receivedByPersonId,

          receivedAt:
            allReceived
              ? now
              : undefined,

          updatedAt:
            now,
        },
      );

    await this.publishAndAudit(
      allReceived
        ? INVENTORY_EVENTS
            .STOCK_TRANSFERRED
        : 'inventory.stock.transfer.partially_received',
      id,
      {
        transferId:
          id,

        transferNumber:
          refreshed.transfer
            .transferNumber,

        propertyId:
          refreshed.transfer
            .propertyId,

        sourceStoreId:
          refreshed.transfer
            .sourceStoreId,

        destinationStoreId:
          refreshed.transfer
            .destinationStoreId,

        completed:
          allReceived,

        actorPersonId:
          dto.receivedByPersonId,
      },
    );

    return this.getTransfer(
      id,
    );

      },
    );
}

  async cancelTransfer(
    id: string,
    dto: CancelStockTransferDto,
  ) {
    const details =
      await this.getTransfer(
        id,
      );

    if (
      details.transfer.status !==
      InventoryTransferStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Inventory transfers can be cancelled; current status is ${details.transfer.status}`,
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

    const cancelled =
      await this
        .stockLedgerRepository
        .updateTransferStatus(
          id,
          {
            status:
              InventoryTransferStatus
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

    if (!cancelled) {
      throw new NotFoundException(
        `Inventory stock transfer not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      'inventory.stock.transfer.cancelled',
      id,
      {
        transferId:
          id,

        transferNumber:
          cancelled.transferNumber,

        propertyId:
          cancelled.propertyId,

        sourceStoreId:
          cancelled.sourceStoreId,

        destinationStoreId:
          cancelled
            .destinationStoreId,

        cancellationReason:
          cancelled
            .cancellationReason,

        actorPersonId:
          dto.cancelledByPersonId,
      },
    );

    return this.getTransfer(
      id,
    );
  }

  private async requireBinForStore(
    binLocationId: string,
    storeId: string,
    role: string,
  ) {
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
        `Invalid, inactive, or mismatched ${role} Inventory bin`,
      );
    }
  }

  private requireUniqueTargets(
    items: Array<{
      transferItemId: string;
      quantity: number;
    }>,
    operation: string,
  ) {
    if (!items?.length) {
      throw new BadRequestException(
        `At least one ${operation} target is required`,
      );
    }

    const ids =
      new Set<string>();

    for (const item of items) {
      if (
        ids.has(
          item.transferItemId,
        )
      ) {
        throw new BadRequestException(
          `Duplicate transfer item in ${operation} request`,
        );
      }

      ids.add(
        item.transferItemId,
      );
    }

    return ids;
  }

  private transferNumber(
    date: Date,
    id: string,
  ) {
    return [
      'TRF',
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

  private requireTransferStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryTransferStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryTransferStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Inventory transfer status: ${value}`,
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

  private roundQuantity(
    value: number,
  ) {
    return Number(
      Number(value).toFixed(6),
    );
  }

  private async publishAndAudit(
    eventType: string,
    transferId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.stock_transfer',

      entityId:
        transferId,

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
