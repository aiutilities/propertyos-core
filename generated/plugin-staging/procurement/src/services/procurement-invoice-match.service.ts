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
  ApproveProcurementInvoiceMatchDto,
} from '../dto/approve-procurement-invoice-match.dto';

import {
  CompleteProcurementInvoiceMatchDto,
} from '../dto/complete-procurement-invoice-match.dto';

import {
  CreateProcurementInvoiceMatchDto,
  CreateProcurementInvoiceMatchItemDto,
} from '../dto/create-procurement-invoice-match.dto';

import {
  RejectProcurementInvoiceMatchDto,
} from '../dto/reject-procurement-invoice-match.dto';

import {
  UpdateProcurementInvoiceMatchDto,
} from '../dto/update-procurement-invoice-match.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';

import {
  PROCUREMENT_INVOICE_MATCH_REPOSITORY,
  ProcurementInvoiceMatchFilters,
  ProcurementInvoiceMatchRepository,
} from '../repositories/procurement-invoice-match.repository';

import {
  PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';

import {
  GoodsReceiptItem,
  GoodsReceiptStatus,
  InvoiceMatchStatus,
  ProcurementInvoiceMatch,
  ProcurementInvoiceMatchItem,
  ProcurementStatusHistory,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '../types/procurement.types';

@Injectable()
export class ProcurementInvoiceMatchService {
  constructor(
    @Inject(
      PROCUREMENT_INVOICE_MATCH_REPOSITORY,
    )
    private readonly repository:
      ProcurementInvoiceMatchRepository,

    @Inject(
      PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
    )
    private readonly purchaseOrderRepository:
      PurchaseOrderRepository,

    @Inject(
      PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
    )
    private readonly goodsReceiptRepository:
      GoodsReceiptRepository,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreateProcurementInvoiceMatchDto,
  ) {
    const purchaseOrder =
      await this.requirePurchaseOrder(
        dto.purchaseOrderId,
      );

    this.validatePurchaseOrderStatus(
      purchaseOrder.status,
    );

    this.validateItemsPresent(
      dto.items,
    );

    const goodsReceipt =
      dto.goodsReceiptId
        ? await this.requireGoodsReceipt(
            dto.goodsReceiptId,
          )
        : undefined;

    if (goodsReceipt) {
      if (
        goodsReceipt.purchaseOrderId !==
        purchaseOrder.id
      ) {
        throw new BadRequestException(
          'Goods Receipt does not belong to the Purchase Order',
        );
      }

      if (
        goodsReceipt.status !==
        GoodsReceiptStatus.POSTED
      ) {
        throw new BadRequestException(
          'Only posted Goods Receipts can be matched',
        );
      }
    }

    const invoiceAmount =
      this.requireNonNegativeNumber(
        dto.invoiceAmount,
        'invoiceAmount',
      );

    const now =
      new Date();

    const invoiceMatchId =
      randomUUID();

    const items =
      this.createItems(
        invoiceMatchId,
        purchaseOrder.items,
        goodsReceipt?.items,
        dto.items,
        now,
      );

    const totals =
      this.calculateTotals(
        items,
        invoiceAmount,
        purchaseOrder.totalAmount,
      );

    const invoiceMatch:
      ProcurementInvoiceMatch = {
        id:
          invoiceMatchId,

        invoiceMatchNumber:
          this.createInvoiceMatchNumber(),

        purchaseOrderId:
          purchaseOrder.id,

        goodsReceiptId:
          goodsReceipt?.id,

        invoiceId:
          dto.invoiceId,

        vendorId:
          purchaseOrder.vendorId,

        propertyId:
          purchaseOrder.propertyId,

        externalInvoiceNumber:
          dto.externalInvoiceNumber
            ?.trim() ||
          undefined,

        invoiceDate:
          dto.invoiceDate
            ? this.parseDate(
                dto.invoiceDate,
                'invoiceDate',
              )
            : undefined,

        invoiceAmount,

        purchaseOrderAmount:
          purchaseOrder.totalAmount,

        goodsReceiptAmount:
          goodsReceipt
            ? totals.goodsReceiptAmount
            : undefined,

        amountVariance:
          totals.amountVariance,

        quantityVariance:
          totals.quantityVariance,

        status:
          InvoiceMatchStatus.PENDING,

        matchedByPersonId:
          dto.matchedByPersonId,

        remarks:
          dto.remarks
            ?.trim() ||
          undefined,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this.repository.create(
        invoiceMatch,
        items,
        this.createHistory(
          invoiceMatch.id,
          undefined,
          InvoiceMatchStatus.PENDING,
          dto.matchedByPersonId,
          'Invoice Match created',
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .INVOICE_MATCH_CREATED,
      created,
      dto.matchedByPersonId,
      dto.remarks,
    );

    return created;
  }

  async list(
    filters:
      ProcurementInvoiceMatchFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requireInvoiceMatch(
      id,
    );
  }

  async update(
    id: string,
    dto: UpdateProcurementInvoiceMatchDto,
  ) {
    const current =
      await this.requireInvoiceMatch(
        id,
      );

    if (
      current.status !==
      InvoiceMatchStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending Invoice Matches can be edited',
      );
    }

    const purchaseOrder =
      await this.requirePurchaseOrder(
        current.purchaseOrderId,
      );

    const goodsReceipt =
      current.goodsReceiptId
        ? await this.requireGoodsReceipt(
            current.goodsReceiptId,
          )
        : undefined;

    const invoiceAmount =
      dto.invoiceAmount !==
      undefined
        ? this.requireNonNegativeNumber(
            dto.invoiceAmount,
            'invoiceAmount',
          )
        : current.invoiceAmount;

    let items:
      ProcurementInvoiceMatchItem[] =
      current.items;

    if (dto.items !== undefined) {
      this.validateItemsPresent(
        dto.items,
      );

      items =
        this.createItems(
          current.id,
          purchaseOrder.items,
          goodsReceipt?.items,
          dto.items,
          new Date(),
        );
    }

    const totals =
      this.calculateTotals(
        items,
        invoiceAmount,
        purchaseOrder.totalAmount,
      );

    const updated:
      ProcurementInvoiceMatch = {
        ...current,

        externalInvoiceNumber:
          dto.externalInvoiceNumber !==
          undefined
            ? dto.externalInvoiceNumber
                .trim() ||
              undefined
            : current.externalInvoiceNumber,

        invoiceDate:
          dto.invoiceDate !==
          undefined
            ? this.parseDate(
                dto.invoiceDate,
                'invoiceDate',
              )
            : current.invoiceDate,

        invoiceAmount,

        purchaseOrderAmount:
          purchaseOrder.totalAmount,

        goodsReceiptAmount:
          goodsReceipt
            ? totals.goodsReceiptAmount
            : undefined,

        amountVariance:
          totals.amountVariance,

        quantityVariance:
          totals.quantityVariance,

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
      dto.items !== undefined
        ? items
        : undefined,
    );
  }

  async complete(
    id: string,
    dto: CompleteProcurementInvoiceMatchDto,
  ) {
    const current =
      await this.requireInvoiceMatch(
        id,
      );

    if (
      current.status !==
      InvoiceMatchStatus.PENDING
    ) {
      throw new BadRequestException(
        `Invoice Match cannot be completed from ${current.status}`,
      );
    }

    if (
      current.items.length === 0
    ) {
      throw new BadRequestException(
        'Invoice Match requires at least one item',
      );
    }

    const matchedItemCount =
      current.items.filter(
        (item) =>
          item.isMatched,
      ).length;

    let status:
      InvoiceMatchStatus;

    if (
      matchedItemCount ===
        current.items.length &&
      current.amountVariance === 0 &&
      current.quantityVariance === 0
    ) {
      status =
        InvoiceMatchStatus.MATCHED;
    } else if (
      matchedItemCount > 0
    ) {
      status =
        InvoiceMatchStatus.PARTIAL_MATCH;
    } else {
      status =
        InvoiceMatchStatus.MISMATCH;
    }

    const now =
      new Date();

    const completed:
      ProcurementInvoiceMatch = {
        ...current,

        status,

        matchedByPersonId:
          dto.matchedByPersonId,

        matchedAt:
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

    const transitioned =
      await this.repository.transition(
        completed,
        this.createHistory(
          current.id,
          current.status,
          status,
          dto.matchedByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .INVOICE_MATCH_COMPLETED,
      transitioned,
      dto.matchedByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  async approve(
    id: string,
    dto: ApproveProcurementInvoiceMatchDto,
  ) {
    const current =
      await this.requireInvoiceMatch(
        id,
      );

    if (
      ![
        InvoiceMatchStatus.MATCHED,
        InvoiceMatchStatus.PARTIAL_MATCH,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Invoice Match cannot be approved from ${current.status}`,
      );
    }

    const now =
      new Date();

    const approved:
      ProcurementInvoiceMatch = {
        ...current,

        status:
          InvoiceMatchStatus.APPROVED,

        approvedByPersonId:
          dto.approvedByPersonId,

        approvedAt:
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

    const transitioned =
      await this.repository.transition(
        approved,
        this.createHistory(
          current.id,
          current.status,
          InvoiceMatchStatus.APPROVED,
          dto.approvedByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .INVOICE_MATCH_APPROVED,
      transitioned,
      dto.approvedByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  async reject(
    id: string,
    dto: RejectProcurementInvoiceMatchDto,
  ) {
    const current =
      await this.requireInvoiceMatch(
        id,
      );

    if (
      ![
        InvoiceMatchStatus.MATCHED,
        InvoiceMatchStatus.PARTIAL_MATCH,
        InvoiceMatchStatus.MISMATCH,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Invoice Match cannot be rejected from ${current.status}`,
      );
    }

    const rejectionReason =
      dto.rejectionReason
        ?.trim();

    if (!rejectionReason) {
      throw new BadRequestException(
        'rejectionReason is required',
      );
    }

    const now =
      new Date();

    const rejected:
      ProcurementInvoiceMatch = {
        ...current,

        status:
          InvoiceMatchStatus.REJECTED,

        rejectedByPersonId:
          dto.rejectedByPersonId,

        rejectedAt:
          now,

        rejectionReason,

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

    const transitioned =
      await this.repository.transition(
        rejected,
        this.createHistory(
          current.id,
          current.status,
          InvoiceMatchStatus.REJECTED,
          dto.rejectedByPersonId,
          rejectionReason,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .INVOICE_MATCH_REJECTED,
      transitioned,
      dto.rejectedByPersonId,
      rejectionReason,
    );

    return transitioned;
  }

  private createItems(
    invoiceMatchId: string,
    purchaseOrderItems:
      PurchaseOrderItem[],
    goodsReceiptItems:
      GoodsReceiptItem[] |
      undefined,
    dtoItems:
      CreateProcurementInvoiceMatchItemDto[],
    now: Date,
  ): ProcurementInvoiceMatchItem[] {
    const purchaseOrderItemMap =
      new Map(
        purchaseOrderItems.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const goodsReceiptItemMap =
      new Map(
        (
          goodsReceiptItems ??
          []
        ).map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const seenPurchaseOrderItemIds =
      new Set<string>();

    return dtoItems.map(
      (dtoItem) => {
        if (
          seenPurchaseOrderItemIds.has(
            dtoItem.purchaseOrderItemId,
          )
        ) {
          throw new BadRequestException(
            `Duplicate Purchase Order item: ${dtoItem.purchaseOrderItemId}`,
          );
        }

        seenPurchaseOrderItemIds.add(
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

        let goodsReceiptItem:
          GoodsReceiptItem |
          undefined;

        if (dtoItem.goodsReceiptItemId) {
          goodsReceiptItem =
            goodsReceiptItemMap.get(
              dtoItem.goodsReceiptItemId,
            );

          if (!goodsReceiptItem) {
            throw new BadRequestException(
              `Goods Receipt item does not belong to the selected Goods Receipt: ${dtoItem.goodsReceiptItemId}`,
            );
          }

          if (
            goodsReceiptItem
              .purchaseOrderItemId !==
            purchaseOrderItem.id
          ) {
            throw new BadRequestException(
              'Goods Receipt item does not match the Purchase Order item',
            );
          }
        } else if (
          goodsReceiptItems
        ) {
          goodsReceiptItem =
            goodsReceiptItems.find(
              (item) =>
                item.purchaseOrderItemId ===
                purchaseOrderItem.id,
            );

          if (!goodsReceiptItem) {
            throw new BadRequestException(
              `No Goods Receipt item exists for Purchase Order item: ${purchaseOrderItem.id}`,
            );
          }
        }

        const invoicedQuantity =
          this.requireNonNegativeNumber(
            dtoItem.invoicedQuantity,
            'invoicedQuantity',
          );

        const unitPrice =
          this.requireNonNegativeNumber(
            dtoItem.unitPrice,
            'unitPrice',
          );

        const receivedQuantity =
          goodsReceiptItem
            ? goodsReceiptItem
                .acceptedQuantity
            : purchaseOrderItem
                .receivedQuantity;

        const invoiceLineAmount =
          this.roundMoney(
            invoicedQuantity *
            unitPrice,
          );

        const purchaseOrderLineAmount =
          this.roundMoney(
            invoicedQuantity *
            purchaseOrderItem.unitPrice,
          );

        const amountVariance =
          this.roundMoney(
            invoiceLineAmount -
            purchaseOrderLineAmount,
          );

        const quantityVariance =
          this.roundQuantity(
            invoicedQuantity -
            receivedQuantity,
          );

        return {
          id:
            randomUUID(),

          invoiceMatchId,

          purchaseOrderItemId:
            purchaseOrderItem.id,

          goodsReceiptItemId:
            goodsReceiptItem?.id,

          invoicedQuantity,

          orderedQuantity:
            purchaseOrderItem
              .orderedQuantity,

          receivedQuantity,

          unitPrice,

          invoiceLineAmount,

          purchaseOrderLineAmount,

          amountVariance,

          quantityVariance,

          isMatched:
            amountVariance === 0 &&
            quantityVariance === 0,

          remarks:
            dtoItem.remarks
              ?.trim() ||
            undefined,

          createdAt:
            now,
        };
      },
    );
  }

  private calculateTotals(
    items:
      ProcurementInvoiceMatchItem[],
    invoiceAmount: number,
    purchaseOrderAmount: number,
  ) {
    const goodsReceiptAmount =
      this.roundMoney(
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            (
              item.receivedQuantity *
              item.unitPrice
            ),
          0,
        ),
      );

    const amountVariance =
      this.roundMoney(
        invoiceAmount -
        purchaseOrderAmount,
      );

    const quantityVariance =
      this.roundQuantity(
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantityVariance,
          0,
        ),
      );

    return {
      goodsReceiptAmount,
      amountVariance,
      quantityVariance,
    };
  }

  private validateItemsPresent(
    items:
      CreateProcurementInvoiceMatchItemDto[],
  ) {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new BadRequestException(
        'Invoice Match requires at least one item',
      );
    }
  }

  private validatePurchaseOrderStatus(
    status: PurchaseOrderStatus,
  ) {
    if (
      ![
        PurchaseOrderStatus
          .PARTIALLY_RECEIVED,
        PurchaseOrderStatus
          .RECEIVED,
        PurchaseOrderStatus
          .CLOSED,
      ].includes(
        status,
      )
    ) {
      throw new BadRequestException(
        `Invoice Match cannot be created for Purchase Order status ${status}`,
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
      await this.goodsReceiptRepository
        .findById(id);

    if (!goodsReceipt) {
      throw new NotFoundException(
        `Goods Receipt not found: ${id}`,
      );
    }

    return goodsReceipt;
  }

  private async requireInvoiceMatch(
    id: string,
  ) {
    const invoiceMatch =
      await this.repository
        .findById(id);

    if (!invoiceMatch) {
      throw new NotFoundException(
        `Invoice Match not found: ${id}`,
      );
    }

    return invoiceMatch;
  }

  private createHistory(
    entityId: string,
    fromStatus:
      InvoiceMatchStatus |
      undefined,
    toStatus:
      InvoiceMatchStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'INVOICE_MATCH',

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

  private requireNonNegativeNumber(
    value: number,
    field: string,
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      throw new BadRequestException(
        `${field} must be a non-negative number`,
      );
    }

    return number;
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

  private roundMoney(
    value: number,
  ) {
    return Math.round(
      (
        value +
        Number.EPSILON
      ) *
      100,
    ) /
    100;
  }

  private roundQuantity(
    value: number,
  ) {
    return Math.round(
      (
        value +
        Number.EPSILON
      ) *
      1000,
    ) /
    1000;
  }

  private createInvoiceMatchNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `IM-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    invoiceMatch:
      ProcurementInvoiceMatch,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...invoiceMatch,

      entityType:
        'procurement.invoice_match',

      entityId:
        invoiceMatch.id,

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
