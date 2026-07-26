import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

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
  CreateProcurementGoodsReceiptDto,
  CreateProcurementGoodsReceiptItemDto,
} from '../dto/create-procurement-goods-receipt.dto';

import {
  PostProcurementGoodsReceiptDto,
} from '../dto/post-procurement-goods-receipt.dto';

import {
  ReverseProcurementGoodsReceiptDto,
} from '../dto/reverse-procurement-goods-receipt.dto';

import {
  UpdateProcurementGoodsReceiptDto,
} from '../dto/update-procurement-goods-receipt.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
  GoodsReceiptFilters,
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';

import {
  PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';

import {
  ProcurementInventoryPostingService,
} from './procurement-inventory-posting.service';

import {
  GoodsReceipt,
  GoodsReceiptItem,
  GoodsReceiptItemStatus,
  GoodsReceiptStatus,
  ProcurementStatusHistory,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '../types/procurement.types';

@Injectable()
export class ProcurementGoodsReceiptService {
  constructor(
    @Inject(
      PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
    )
    private readonly repository:
      GoodsReceiptRepository,

    @Inject(
      PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
    )
    private readonly purchaseOrderRepository:
      PurchaseOrderRepository,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,

    private readonly inventoryPostingService:
      ProcurementInventoryPostingService,

    private readonly transitionMetrics:
      ProcurementTransitionMetricsService,

  ) {}

  async create(
    dto: CreateProcurementGoodsReceiptDto,
  ) {
    const purchaseOrder =
      await this.requirePurchaseOrder(
        dto.purchaseOrderId,
      );

    this.validateReceivablePurchaseOrderStatus(
      purchaseOrder.status,
    );

    this.validateItemsPresent(
      dto.items,
    );

    const now =
      new Date();

    const goodsReceiptId =
      randomUUID();

    const receiptDate =
      dto.receiptDate
        ? this.parseDate(
            dto.receiptDate,
            'receiptDate',
          )
        : now;

    const postedQuantities =
      await this.repository
        .aggregatePostedQuantities(
          purchaseOrder.id,
        );

    const postedQuantityMap =
      new Map(
        postedQuantities.map(
          (entry) => [
            entry.purchaseOrderItemId,
            entry.postedReceivedQuantity,
          ],
        ),
      );

    const items =
      this.createItems(
        goodsReceiptId,
        purchaseOrder.items,
        postedQuantityMap,
        dto.items,
        now,
      );

    const goodsReceipt:
      GoodsReceipt = {
        id:
          goodsReceiptId,

        goodsReceiptNumber:
          this.createGoodsReceiptNumber(),

        purchaseOrderId:
          purchaseOrder.id,

        propertyId:
          purchaseOrder.propertyId,

        vendorId:
          purchaseOrder.vendorId,

        destinationStoreId:
          dto.destinationStoreId,

        destinationBinLocationId:
          dto.destinationBinLocationId,

        status:
          GoodsReceiptStatus.DRAFT,

        receiptDate,

        deliveryReference:
          dto.deliveryReference
            ?.trim() ||
          undefined,

        invoiceReference:
          dto.invoiceReference
            ?.trim() ||
          undefined,

        receivedByPersonId:
          dto.receivedByPersonId,

        remarks:
          dto.remarks
            ?.trim() ||
          undefined,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const history =
      this.createHistory(
        goodsReceipt.id,
        undefined,
        GoodsReceiptStatus.DRAFT,
        dto.receivedByPersonId,
        'Goods Receipt created',
      );

    const created =
      await this.repository.create(
        goodsReceipt,
        items,
        history,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .GOODS_RECEIPT_CREATED,
      created,
      dto.receivedByPersonId,
    );

    return created;
  }

  async list(
    filters:
      GoodsReceiptFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requireGoodsReceipt(
      id,
    );
  }

  async update(
    id: string,
    dto: UpdateProcurementGoodsReceiptDto,
  ) {
    const current =
      await this.requireGoodsReceipt(
        id,
      );

    if (
      current.status !==
      GoodsReceiptStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft Goods Receipts can be edited',
      );
    }

    const purchaseOrder =
      await this.requirePurchaseOrder(
        current.purchaseOrderId,
      );

    this.validateReceivablePurchaseOrderStatus(
      purchaseOrder.status,
    );

    const receiptDate =
      dto.receiptDate
        ? this.parseDate(
            dto.receiptDate,
            'receiptDate',
          )
        : current.receiptDate;

    let items:
      GoodsReceiptItem[] |
      undefined;

    if (dto.items !== undefined) {
      this.validateItemsPresent(
        dto.items,
      );

      const postedQuantities =
        await this.repository
          .aggregatePostedQuantities(
            purchaseOrder.id,
          );

      const postedQuantityMap =
        new Map(
          postedQuantities.map(
            (entry) => [
              entry.purchaseOrderItemId,
              entry.postedReceivedQuantity,
            ],
          ),
        );

      items =
        this.createItems(
          current.id,
          purchaseOrder.items,
          postedQuantityMap,
          dto.items,
          new Date(),
        );
    }

    const updated:
      GoodsReceipt = {
        ...current,

        destinationStoreId:
          dto.destinationStoreId !==
          undefined
            ? dto.destinationStoreId
            : current.destinationStoreId,

        destinationBinLocationId:
          dto.destinationBinLocationId !==
          undefined
            ? dto.destinationBinLocationId
            : current.destinationBinLocationId,

        receiptDate,

        deliveryReference:
          dto.deliveryReference !==
          undefined
            ? dto.deliveryReference
                .trim() ||
              undefined
            : current.deliveryReference,

        invoiceReference:
          dto.invoiceReference !==
          undefined
            ? dto.invoiceReference
                .trim() ||
              undefined
            : current.invoiceReference,

        receivedByPersonId:
          dto.receivedByPersonId ??
          current.receivedByPersonId,

        remarks:
          dto.remarks !==
          undefined
            ? dto.remarks
                .trim() ||
              undefined
            : current.remarks,

        updatedAt:
          new Date(),
      };

    return this.repository.update(
      updated,
      items,
    );
  }

  async post(
    id: string,
    dto: PostProcurementGoodsReceiptDto,
  ) {
    return this.transitionMetrics.observe(
      'goods_receipt_post',
      async () => {
    const current =
      await this.requireGoodsReceipt(
        id,
      );

    if (
      current.status !==
      GoodsReceiptStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Goods Receipt cannot be posted from ${current.status}`,
      );
    }

    const purchaseOrder =
      await this.requirePurchaseOrder(
        current.purchaseOrderId,
      );

    this.validateReceivablePurchaseOrderStatus(
      purchaseOrder.status,
    );

    if (
      current.items.length === 0
    ) {
      throw new BadRequestException(
        'Goods Receipt requires at least one item',
      );
    }

    const purchaseOrderItemMap =
      new Map(
        purchaseOrder.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const postedQuantities =
      await this.repository
        .aggregatePostedQuantities(
          purchaseOrder.id,
        );

    const postedQuantityMap =
      new Map(
        postedQuantities.map(
          (entry) => [
            entry.purchaseOrderItemId,
            entry.postedReceivedQuantity,
          ],
        ),
      );

    const postingItems =
      current.items.map(
        (receiptItem) => {
          const purchaseOrderItem =
            purchaseOrderItemMap.get(
              receiptItem.purchaseOrderItemId,
            );

          if (!purchaseOrderItem) {
            throw new BadRequestException(
              `Purchase Order item does not belong to this Purchase Order: ${receiptItem.purchaseOrderItemId}`,
            );
          }

          const cumulativeReceivedQuantity =
            postedQuantityMap.get(
              purchaseOrderItem.id,
            ) ??
            purchaseOrderItem
              .receivedQuantity;

          const newCumulativeReceivedQuantity =
            cumulativeReceivedQuantity +
            receiptItem.receivedQuantity;

          if (
            newCumulativeReceivedQuantity >
            purchaseOrderItem
              .orderedQuantity
          ) {
            throw new BadRequestException(
              `Receipt quantity exceeds the remaining ordered quantity for Purchase Order item: ${purchaseOrderItem.id}`,
            );
          }

          return {
            goodsReceiptItemId:
              receiptItem.id,

            purchaseOrderItemId:
              purchaseOrderItem.id,

            receivedQuantity:
              receiptItem.receivedQuantity,

            newCumulativeReceivedQuantity,
          };
        },
      );

    const cumulativeByItemId =
      new Map(
        purchaseOrder.items.map(
          (item) => [
            item.id,
            postedQuantityMap.get(
              item.id,
            ) ??
            item.receivedQuantity,
          ],
        ),
      );

    for (
      const item
      of postingItems
    ) {
      cumulativeByItemId.set(
        item.purchaseOrderItemId,
        item.newCumulativeReceivedQuantity,
      );
    }

    const allItemsReceived =
      purchaseOrder.items.every(
        (item) =>
          (
            cumulativeByItemId.get(
              item.id,
            ) ??
            0
          ) >=
          item.orderedQuantity,
      );

    const anyItemReceived =
      purchaseOrder.items.some(
        (item) =>
          (
            cumulativeByItemId.get(
              item.id,
            ) ??
            0
          ) > 0,
      );

    const purchaseOrderStatus =
      allItemsReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyItemReceived
          ? PurchaseOrderStatus.PARTIALLY_RECEIVED
          : purchaseOrder.status;

    const now =
      new Date();

    const posted:
      GoodsReceipt = {
        ...current,

        status:
          GoodsReceiptStatus.POSTED,

        postedByPersonId:
          dto.postedByPersonId,

        postedAt:
          now,

        remarks:
          dto.remarks !==
          undefined
            ? dto.remarks
                .trim() ||
              current.remarks
            : current.remarks,

        updatedAt:
          now,
      };

    const inventoryPostingResults =
      await this.inventoryPostingService
        .postGoodsReceipt(
          current,
          purchaseOrder,
          dto.postedByPersonId,
        );

    const inventoryPostingByReceiptItemId =
      new Map(
        inventoryPostingResults.map(
          (posting) => [
            posting.goodsReceiptItemId,
            posting,
          ],
        ),
      );

    const postingItemsWithBatch =
      postingItems.map(
        (item) => ({
          ...item,

          batchId:
            inventoryPostingByReceiptItemId
              .get(
                item.goodsReceiptItemId,
              )
              ?.batchId,
        }),
      );

    const result =
      await this.repository.post(
        posted,
        postingItemsWithBatch,
        purchaseOrderStatus,
        this.createHistory(
          current.id,
          current.status,
          GoodsReceiptStatus.POSTED,
          dto.postedByPersonId,
          dto.remarks,
        ),

        this.createPurchaseOrderHistory(
          purchaseOrder.id,
          purchaseOrder.status,
          purchaseOrderStatus,
          dto.postedByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .GOODS_RECEIPT_POSTED,
      result.goodsReceipt,
      dto.postedByPersonId,
      dto.remarks,
    );

    if (
      purchaseOrderStatus ===
      PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      await this.publishPurchaseOrderAndAudit(
        PROCUREMENT_EVENTS
          .PURCHASE_ORDER_PARTIALLY_RECEIVED,
        purchaseOrder,
        purchaseOrderStatus,
        dto.postedByPersonId,
        dto.remarks,
      );
    }

    if (
      purchaseOrderStatus ===
      PurchaseOrderStatus.RECEIVED
    ) {
      await this.publishPurchaseOrderAndAudit(
        PROCUREMENT_EVENTS
          .PURCHASE_ORDER_RECEIVED,
        purchaseOrder,
        purchaseOrderStatus,
        dto.postedByPersonId,
        dto.remarks,
      );
    }

    return result.goodsReceipt;

      },
    );
}

  async reverse(
    id: string,
    dto: ReverseProcurementGoodsReceiptDto,
  ) {
    const current =
      await this.requireGoodsReceipt(
        id,
      );

    if (
      current.status !==
      GoodsReceiptStatus.POSTED
    ) {
      throw new BadRequestException(
        `Goods Receipt cannot be reversed from ${current.status}`,
      );
    }

    const reversalReason =
      dto.reversalReason
        ?.trim();

    if (!reversalReason) {
      throw new BadRequestException(
        'reversalReason is required',
      );
    }

    const purchaseOrder =
      await this.requirePurchaseOrder(
        current.purchaseOrderId,
      );

    const purchaseOrderItemMap =
      new Map(
        purchaseOrder.items.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const reversalItems =
      current.items.map(
        (receiptItem) => {
          const purchaseOrderItem =
            purchaseOrderItemMap.get(
              receiptItem.purchaseOrderItemId,
            );

          if (!purchaseOrderItem) {
            throw new BadRequestException(
              `Purchase Order item does not belong to this Purchase Order: ${receiptItem.purchaseOrderItemId}`,
            );
          }

          const restoredCumulativeReceivedQuantity =
            purchaseOrderItem
              .receivedQuantity -
            receiptItem.receivedQuantity;

          if (
            restoredCumulativeReceivedQuantity <
            0
          ) {
            throw new BadRequestException(
              `Reversal would make received quantity negative for Purchase Order item: ${purchaseOrderItem.id}`,
            );
          }

          return {
            goodsReceiptItemId:
              receiptItem.id,

            purchaseOrderItemId:
              purchaseOrderItem.id,

            receivedQuantity:
              receiptItem.receivedQuantity,

            restoredCumulativeReceivedQuantity,
          };
        },
      );

    const restoredQuantityMap =
      new Map(
        purchaseOrder.items.map(
          (item) => [
            item.id,
            item.receivedQuantity,
          ],
        ),
      );

    for (
      const item
      of reversalItems
    ) {
      restoredQuantityMap.set(
        item.purchaseOrderItemId,
        item.restoredCumulativeReceivedQuantity,
      );
    }

    const allItemsReceived =
      purchaseOrder.items.every(
        (item) =>
          (
            restoredQuantityMap.get(
              item.id,
            ) ??
            0
          ) >=
          item.orderedQuantity,
      );

    const anyItemReceived =
      purchaseOrder.items.some(
        (item) =>
          (
            restoredQuantityMap.get(
              item.id,
            ) ??
            0
          ) > 0,
      );

    let purchaseOrderStatus:
      PurchaseOrderStatus;

    if (allItemsReceived) {
      purchaseOrderStatus =
        PurchaseOrderStatus.RECEIVED;
    } else if (anyItemReceived) {
      purchaseOrderStatus =
        PurchaseOrderStatus.PARTIALLY_RECEIVED;
    } else if (
      purchaseOrder.acknowledgedAt
    ) {
      purchaseOrderStatus =
        PurchaseOrderStatus.ACKNOWLEDGED;
    } else {
      purchaseOrderStatus =
        PurchaseOrderStatus.ISSUED;
    }

    const now =
      new Date();

    const reversed:
      GoodsReceipt = {
        ...current,

        status:
          GoodsReceiptStatus.REVERSED,

        reversedByPersonId:
          dto.reversedByPersonId,

        reversedAt:
          now,

        reversalReason,

        remarks:
          dto.remarks !==
          undefined
            ? dto.remarks
                .trim() ||
              current.remarks
            : current.remarks,

        updatedAt:
          now,
      };

    const result =
      await this.repository.reverse(
        reversed,
        reversalItems,
        purchaseOrderStatus,
        this.createHistory(
          current.id,
          current.status,
          GoodsReceiptStatus.REVERSED,
          dto.reversedByPersonId,
          reversalReason,
        ),

        this.createPurchaseOrderHistory(
          purchaseOrder.id,
          purchaseOrder.status,
          purchaseOrderStatus,
          dto.reversedByPersonId,
          reversalReason,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .GOODS_RECEIPT_REVERSED,
      result.goodsReceipt,
      dto.reversedByPersonId,
      reversalReason,
    );

    return result.goodsReceipt;
  }

  private createItems(
    goodsReceiptId: string,
    purchaseOrderItems:
      PurchaseOrderItem[],
    postedQuantityMap:
      Map<string, number>,
    dtoItems:
      CreateProcurementGoodsReceiptItemDto[],
    now: Date,
  ): GoodsReceiptItem[] {
    const purchaseOrderItemMap =
      new Map(
        purchaseOrderItems.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const seenItemIds =
      new Set<string>();

    return dtoItems.map(
      (dtoItem) => {
        if (
          seenItemIds.has(
            dtoItem.purchaseOrderItemId,
          )
        ) {
          throw new BadRequestException(
            `Duplicate Purchase Order item: ${dtoItem.purchaseOrderItemId}`,
          );
        }

        seenItemIds.add(
          dtoItem.purchaseOrderItemId,
        );

        const purchaseOrderItem =
          purchaseOrderItemMap.get(
            dtoItem.purchaseOrderItemId,
          );

        if (!purchaseOrderItem) {
          throw new BadRequestException(
            `Purchase Order item does not belong to this Purchase Order: ${dtoItem.purchaseOrderItemId}`,
          );
        }

        const previouslyReceivedQuantity =
          postedQuantityMap.get(
            purchaseOrderItem.id,
          ) ??
          purchaseOrderItem
            .receivedQuantity;

        this.validateItemQuantities(
          dtoItem,
          purchaseOrderItem,
          previouslyReceivedQuantity,
        );

        const status =
          this.deriveItemStatus(
            dtoItem.acceptedQuantity,
            dtoItem.rejectedQuantity,
          );

        return {
          id:
            randomUUID(),

          goodsReceiptId,

          purchaseOrderItemId:
            purchaseOrderItem.id,

          orderedQuantity:
            purchaseOrderItem
              .orderedQuantity,

          previouslyReceivedQuantity,

          receivedQuantity:
            dtoItem.receivedQuantity,

          acceptedQuantity:
            dtoItem.acceptedQuantity,

          rejectedQuantity:
            dtoItem.rejectedQuantity,

          status,

          rejectionReason:
            dtoItem.rejectionReason
              ?.trim() ||
            undefined,

          remarks:
            dtoItem.remarks
              ?.trim() ||
            undefined,

          batchNumber:
            dtoItem.batchNumber
              ?.trim() ||
            undefined,

          manufacturerBatchNumber:
            dtoItem.manufacturerBatchNumber
              ?.trim() ||
            undefined,

          manufactureDate:
            dtoItem.manufactureDate
              ? this.parseDate(
                  dtoItem.manufactureDate,
                  'manufactureDate',
                )
              : undefined,

          expiryDate:
            dtoItem.expiryDate
              ? this.parseDate(
                  dtoItem.expiryDate,
                  'expiryDate',
                )
              : undefined,

          createdAt:
            now,

          updatedAt:
            now,
        };
      },
    );
  }

  private validateItemsPresent(
    items:
      CreateProcurementGoodsReceiptItemDto[],
  ) {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new BadRequestException(
        'Goods Receipt requires at least one item',
      );
    }
  }

  private validateItemQuantities(
    dtoItem:
      CreateProcurementGoodsReceiptItemDto,
    purchaseOrderItem:
      PurchaseOrderItem,
    previouslyReceivedQuantity:
      number,
  ) {
    const receivedQuantity =
      Number(
        dtoItem.receivedQuantity,
      );

    const acceptedQuantity =
      Number(
        dtoItem.acceptedQuantity,
      );

    const rejectedQuantity =
      Number(
        dtoItem.rejectedQuantity ??
        0,
      );

    if (
      !Number.isFinite(
        receivedQuantity,
      ) ||
      receivedQuantity <= 0
    ) {
      throw new BadRequestException(
        'receivedQuantity must be greater than zero',
      );
    }

    if (
      !Number.isFinite(
        acceptedQuantity,
      ) ||
      acceptedQuantity < 0
    ) {
      throw new BadRequestException(
        'acceptedQuantity cannot be negative',
      );
    }

    if (
      !Number.isFinite(
        rejectedQuantity,
      ) ||
      rejectedQuantity < 0
    ) {
      throw new BadRequestException(
        'rejectedQuantity cannot be negative',
      );
    }

    if (
      acceptedQuantity +
      rejectedQuantity !==
      receivedQuantity
    ) {
      throw new BadRequestException(
        'acceptedQuantity plus rejectedQuantity must equal receivedQuantity',
      );
    }

    if (
      previouslyReceivedQuantity +
      receivedQuantity >
      purchaseOrderItem
        .orderedQuantity
    ) {
      throw new BadRequestException(
        `Receipt quantity exceeds the remaining ordered quantity for Purchase Order item: ${purchaseOrderItem.id}`,
      );
    }

    if (
      rejectedQuantity > 0 &&
      !dtoItem.rejectionReason
        ?.trim()
    ) {
      throw new BadRequestException(
        'rejectionReason is required when rejectedQuantity is greater than zero',
      );
    }

    const manufactureDate =
      dtoItem.manufactureDate
        ? this.parseDate(
            dtoItem.manufactureDate,
            'manufactureDate',
          )
        : undefined;

    const expiryDate =
      dtoItem.expiryDate
        ? this.parseDate(
            dtoItem.expiryDate,
            'expiryDate',
          )
        : undefined;

    if (
      manufactureDate &&
      expiryDate &&
      expiryDate.getTime() <
        manufactureDate.getTime()
    ) {
      throw new BadRequestException(
        'expiryDate cannot be before manufactureDate',
      );
    }

    const hasBatchMetadata =
      Boolean(
        dtoItem.batchNumber
          ?.trim(),
      ) ||
      Boolean(
        dtoItem.manufacturerBatchNumber
          ?.trim(),
      ) ||
      Boolean(
        manufactureDate,
      ) ||
      Boolean(
        expiryDate,
      );

    if (
      hasBatchMetadata &&
      !dtoItem.batchNumber
        ?.trim()
    ) {
      throw new BadRequestException(
        'batchNumber is required when Goods Receipt Batch metadata is supplied',
      );
    }
  }

  private deriveItemStatus(
    acceptedQuantity: number,
    rejectedQuantity: number,
  ): GoodsReceiptItemStatus {
    if (
      acceptedQuantity === 0 &&
      rejectedQuantity > 0
    ) {
      return GoodsReceiptItemStatus
        .REJECTED;
    }

    if (
      acceptedQuantity > 0 &&
      rejectedQuantity > 0
    ) {
      return GoodsReceiptItemStatus
        .PARTIALLY_ACCEPTED;
    }

    return GoodsReceiptItemStatus
      .ACCEPTED;
  }

  private validateReceivablePurchaseOrderStatus(
    status: PurchaseOrderStatus,
  ) {
    if (
      ![
        PurchaseOrderStatus.ISSUED,
        PurchaseOrderStatus.ACKNOWLEDGED,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ].includes(
        status,
      )
    ) {
      throw new BadRequestException(
        `Goods Receipt cannot be created for Purchase Order status ${status}`,
      );
    }
  }

  private async requirePurchaseOrder(
    id: string,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepository
        .findById(id);

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase Order not found: ${id}`,
      );
    }

    return purchaseOrder;
  }

  private async requireGoodsReceipt(
    id: string,
  ) {
    const goodsReceipt =
      await this.repository
        .findById(id);

    if (!goodsReceipt) {
      throw new NotFoundException(
        `Goods Receipt not found: ${id}`,
      );
    }

    return goodsReceipt;
  }

  private createHistory(
    entityId: string,
    fromStatus:
      GoodsReceiptStatus |
      undefined,
    toStatus:
      GoodsReceiptStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'GOODS_RECEIPT',

      entityId,

      fromStatus,

      toStatus,

      changedByPersonId,

      remarks:
        remarks?.trim() ||
        undefined,

      createdAt:
        new Date(),
    };
  }

  private createPurchaseOrderHistory(
    entityId: string,
    fromStatus: PurchaseOrderStatus,
    toStatus: PurchaseOrderStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'PURCHASE_ORDER',

      entityId,

      fromStatus,

      toStatus,

      changedByPersonId,

      remarks:
        remarks?.trim() ||
        undefined,

      createdAt:
        new Date(),
    };
  }

  private parseDate(
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
        `Invalid ${field}`,
      );
    }

    return date;
  }

  private createGoodsReceiptNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `GRN-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishPurchaseOrderAndAudit(
    eventName: string,
    purchaseOrder:
      PurchaseOrder,
    status:
      PurchaseOrderStatus,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...purchaseOrder,

      status,

      entityType:
        'procurement.purchase_order',

      entityId:
        purchaseOrder.id,

      actorPersonId,

      remarks:
        remarks?.trim() ||
        undefined,

      eventVersion:
        1,
    };

    await this.eventBus.publish(
      eventName,
      'core.procurement',
      payload,
    );

    await this.auditService.record(
      eventName,
      'core.procurement',
      payload,
    );
  }

  private async publishAndAudit(
    eventName: string,
    goodsReceipt:
      GoodsReceipt,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...goodsReceipt,

      entityType:
        'procurement.goods_receipt',

      entityId:
        goodsReceipt.id,

      actorPersonId,

      remarks:
        remarks?.trim() ||
        undefined,

      eventVersion:
        1,
    };

    await this.eventBus.publish(
      eventName,
      'core.procurement',
      payload,
    );

    await this.auditService.record(
      eventName,
      'core.procurement',
      payload,
    );
  }
}
