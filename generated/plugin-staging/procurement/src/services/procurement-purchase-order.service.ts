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
  CreateProcurementPurchaseOrderDto,
} from '../dto/create-procurement-purchase-order.dto';

import {
  TransitionProcurementPurchaseOrderDto,
} from '../dto/transition-procurement-purchase-order.dto';

import {
  UpdateProcurementPurchaseOrderDto,
} from '../dto/update-procurement-purchase-order.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
  PurchaseOrderFilters,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';

import {
  PROCUREMENT_QUOTATION_REPOSITORY,
  ProcurementQuotationRepository,
} from '../repositories/procurement-quotation.repository';

import {
  ProcurementStatusHistory,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  QuotationStatus,
} from '../types/procurement.types';

import {
  ProcurementRfqService,
} from './procurement-rfq.service';

@Injectable()
export class ProcurementPurchaseOrderService {
  constructor(
    @Inject(
      PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
    )
    private readonly repository:
      PurchaseOrderRepository,

    @Inject(
      PROCUREMENT_QUOTATION_REPOSITORY,
    )
    private readonly quotationRepository:
      ProcurementQuotationRepository,

    private readonly rfqService:
      ProcurementRfqService,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreateProcurementPurchaseOrderDto,
  ) {
    const quotation =
      await this.quotationRepository
        .findById(
          dto.quotationId,
        );

    if (!quotation) {
      throw new NotFoundException(
        `Quotation not found: ${dto.quotationId}`,
      );
    }

    if (
      quotation.status !==
      QuotationStatus.SELECTED
    ) {
      throw new BadRequestException(
        `Purchase Order requires a SELECTED quotation. Current status: ${quotation.status}`,
      );
    }

    const existing =
      await this.repository
        .findByQuotationId(
          quotation.id,
        );

    if (existing) {
      throw new BadRequestException(
        'A Purchase Order already exists for this quotation',
      );
    }

    const rfq =
      await this.rfqService.get(
        quotation.rfqId,
      );

    const now =
      new Date();

    const purchaseOrderId =
      randomUUID();

    const orderDate =
      dto.orderDate
        ? this.parseDate(
            dto.orderDate,
            'orderDate',
          )
        : now;

    const expectedDeliveryDate =
      dto.expectedDeliveryDate
        ? this.parseDate(
            dto.expectedDeliveryDate,
            'expectedDeliveryDate',
          )
        : quotation.deliveryDays !== undefined
          ? new Date(
              orderDate.getTime()
              + quotation.deliveryDays
              * 24
              * 60
              * 60
              * 1000,
            )
          : undefined;

    if (
      expectedDeliveryDate &&
      expectedDeliveryDate.getTime() <
      orderDate.getTime()
    ) {
      throw new BadRequestException(
        'expectedDeliveryDate cannot be before orderDate',
      );
    }

    const purchaseOrder:
      PurchaseOrder = {
        id:
          purchaseOrderId,

        purchaseOrderNumber:
          this.createPurchaseOrderNumber(),

        quotationId:
          quotation.id,

        rfqId:
          quotation.rfqId,

        purchaseRequestId:
          rfq.purchaseRequestId,

        propertyId:
          rfq.propertyId,

        vendorId:
          quotation.vendorId,

        status:
          PurchaseOrderStatus.DRAFT,

        orderDate,

        expectedDeliveryDate,

        shippingAddress:
          dto.shippingAddress
            ?.trim() ||
          undefined,

        billingAddress:
          dto.billingAddress
            ?.trim() ||
          undefined,

        subtotal:
          quotation.subtotal,

        discountAmount:
          quotation.discountAmount,

        taxAmount:
          quotation.taxAmount,

        freightAmount:
          quotation.freightAmount,

        totalAmount:
          quotation.totalAmount,

        currency:
          quotation.currency,

        paymentTerms:
          dto.paymentTerms
            ?.trim() ||
          quotation.paymentTerms,

        deliveryTerms:
          dto.deliveryTerms
            ?.trim() ||
          quotation.deliveryTerms,

        title:
          dto.title.trim(),

        description:
          dto.description
            ?.trim() ||
          quotation.notes,

        vendorContractId:
          dto.vendorContractId,

        createdByPersonId:
          dto.createdByPersonId,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const items =
      this.createItems(
        purchaseOrderId,
        quotation.items,
        rfq.items,
        now,
      );

    const created =
      await this.repository.create(
        purchaseOrder,
        items,
      );

    await this.repository.addHistory(
      this.createHistory(
        created.id,
        undefined,
        created.status,
        dto.createdByPersonId,
        'Purchase Order created',
      ),
    );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_CREATED,
      created,
      dto.createdByPersonId,
    );

    return this.requirePurchaseOrder(
      created.id,
    );
  }

  async list(
    filters:
      PurchaseOrderFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requirePurchaseOrder(
      id,
    );
  }

  async update(
    id: string,
    dto: UpdateProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft Purchase Orders can be edited',
      );
    }

    const orderDate =
      dto.orderDate
        ? this.parseDate(
            dto.orderDate,
            'orderDate',
          )
        : current.orderDate;

    const expectedDeliveryDate =
      dto.expectedDeliveryDate !==
      undefined
        ? dto.expectedDeliveryDate
          ? this.parseDate(
              dto.expectedDeliveryDate,
              'expectedDeliveryDate',
            )
          : undefined
        : current.expectedDeliveryDate;

    if (
      expectedDeliveryDate &&
      expectedDeliveryDate.getTime() <
      orderDate.getTime()
    ) {
      throw new BadRequestException(
        'expectedDeliveryDate cannot be before orderDate',
      );
    }

    const updated:
      PurchaseOrder = {
        ...current,

        orderDate,

        expectedDeliveryDate,

        shippingAddress:
          dto.shippingAddress !==
          undefined
            ? dto.shippingAddress
                .trim() ||
              undefined
            : current.shippingAddress,

        billingAddress:
          dto.billingAddress !==
          undefined
            ? dto.billingAddress
                .trim() ||
              undefined
            : current.billingAddress,

        paymentTerms:
          dto.paymentTerms !==
          undefined
            ? dto.paymentTerms
                .trim() ||
              undefined
            : current.paymentTerms,

        deliveryTerms:
          dto.deliveryTerms !==
          undefined
            ? dto.deliveryTerms
                .trim() ||
              undefined
            : current.deliveryTerms,

        title:
          dto.title !==
          undefined
            ? dto.title.trim()
            : current.title,

        description:
          dto.description !==
          undefined
            ? dto.description
                .trim() ||
              undefined
            : current.description,

        vendorContractId:
          dto.vendorContractId !==
          undefined
            ? dto.vendorContractId
            : current.vendorContractId,

        updatedAt:
          new Date(),
      };

    const saved =
      await this.repository.update(
        updated,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_UPDATED,
      saved,
      dto.updatedByPersonId,
    );

    return saved;
  }

  async submitForApproval(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be submitted from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.PENDING_APPROVAL,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_SUBMITTED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async approve(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be approved from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.APPROVED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_APPROVED,
      dto.changedByPersonId,
      dto.remarks,
      {
        approvedByPersonId:
          dto.changedByPersonId,

        approvedAt:
          new Date(),
      },
    );
  }

  async issue(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be issued from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.ISSUED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_ISSUED,
      dto.changedByPersonId,
      dto.remarks,
      {
        issuedByPersonId:
          dto.changedByPersonId,

        issuedAt:
          new Date(),
      },
    );
  }

  async acknowledge(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.ISSUED
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be acknowledged from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.ACKNOWLEDGED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_ACKNOWLEDGED,
      dto.changedByPersonId,
      dto.remarks,
      {
        acknowledgedByPersonId:
          dto.changedByPersonId,

        acknowledgedAt:
          new Date(),
      },
    );
  }

  async markReceived(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      ![
        PurchaseOrderStatus.ISSUED,
        PurchaseOrderStatus.ACKNOWLEDGED,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be marked received from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.RECEIVED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_RECEIVED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async close(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      current.status !==
      PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be closed from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.CLOSED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_CLOSED,
      dto.changedByPersonId,
      dto.remarks,
      {
        closedAt:
          new Date(),
      },
    );
  }

  async cancel(
    id: string,
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    const current =
      await this.requirePurchaseOrder(
        id,
      );

    if (
      ![
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PENDING_APPROVAL,
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.ISSUED,
        PurchaseOrderStatus.ACKNOWLEDGED,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Purchase Order cannot be cancelled from ${current.status}`,
      );
    }

    return this.transition(
      current,
      PurchaseOrderStatus.CANCELLED,
      PROCUREMENT_EVENTS
        .PURCHASE_ORDER_CANCELLED,
      dto.changedByPersonId,
      dto.remarks,
      {
        cancelledByPersonId:
          dto.changedByPersonId,

        cancelledAt:
          new Date(),

        cancellationReason:
          dto.remarks?.trim() ||
          undefined,
      },
    );
  }

  private createItems(
    purchaseOrderId: string,
    quotationItems:
      Array<Record<string, any>>,
    rfqItems:
      Array<Record<string, any>>,
    now: Date,
  ): PurchaseOrderItem[] {
    const rfqItemMap =
      new Map(
        rfqItems.map(
          (
            item,
          ) => [
            item.id,
            item,
          ],
        ),
      );

    return quotationItems.map(
      (
        item,
        index,
      ) => {
        const rfqItem =
          rfqItemMap.get(
            item.rfqItemId,
          );

        if (!rfqItem) {
          throw new BadRequestException(
            `RFQ item not found for quotation item: ${item.id}`,
          );
        }

        return {
          id:
            randomUUID(),

          purchaseOrderId,

          quotationItemId:
            item.id,

          purchaseRequestItemId:
            rfqItem.purchaseRequestItemId,

          lineNumber:
            item.lineNumber ??
            index + 1,

          itemType:
            rfqItem.itemType,

          itemCode:
            rfqItem.itemCode,

          description:
            item.description ??
            rfqItem.description,

          orderedQuantity:
            item.quantity,

          receivedQuantity:
            0,

          unit:
            item.unit,

          unitPrice:
            item.unitPrice,

          discountAmount:
            item.discountAmount,

          taxRate:
            item.taxRate,

          taxAmount:
            item.taxAmount,

          lineTotal:
            item.lineTotal,

          createdAt:
            now,

          updatedAt:
            now,
        };
      },
    );
  }

  private async transition(
    current:
      PurchaseOrder & {
        items:
          PurchaseOrderItem[];
        history:
          ProcurementStatusHistory[];
      },
    toStatus:
      PurchaseOrderStatus,
    eventName: string,
    actorPersonId: string,
    remarks?: string,
    patch: Partial<
      PurchaseOrder
    > = {},
  ) {
    const updated:
      PurchaseOrder = {
        ...current,
        ...patch,

        status:
          toStatus,

        updatedAt:
          new Date(),
      };

    const saved =
      await this.repository.update(
        updated,
      );

    await this.repository.addHistory(
      this.createHistory(
        current.id,
        current.status,
        toStatus,
        actorPersonId,
        remarks,
      ),
    );

    await this.publishAndAudit(
      eventName,
      saved,
      actorPersonId,
      remarks,
    );

    return this.requirePurchaseOrder(
      saved.id,
    );
  }

  private async requirePurchaseOrder(
    id: string,
  ) {
    const purchaseOrder =
      await this.repository
        .findById(id);

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase Order not found: ${id}`,
      );
    }

    return purchaseOrder;
  }

  private createHistory(
    entityId: string,
    fromStatus:
      PurchaseOrderStatus |
      undefined,
    toStatus:
      PurchaseOrderStatus,
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

  private createPurchaseOrderNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `PO-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    purchaseOrder:
      PurchaseOrder,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...purchaseOrder,

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
}
