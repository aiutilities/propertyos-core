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
  CreatePurchaseRequestDto,
} from '../dto/create-purchase-request.dto';

import {
  RejectPurchaseRequestDto,
} from '../dto/reject-purchase-request.dto';

import {
  TransitionPurchaseRequestDto,
} from '../dto/transition-purchase-request.dto';

import {
  UpdatePurchaseRequestDto,
} from '../dto/update-purchase-request.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PURCHASE_REQUEST_REPOSITORY,
  PurchaseRequestFilters,
  PurchaseRequestRepository,
} from '../repositories/purchase-request.repository';

import {
  ProcurementStatusHistory,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestStatus,
} from '../types/procurement.types';

@Injectable()
export class PurchaseRequestService {
  constructor(
    @Inject(
      PURCHASE_REQUEST_REPOSITORY,
    )
    private readonly repository:
      PurchaseRequestRepository,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreatePurchaseRequestDto,
  ) {
    this.validateCreateInput(dto);

    const now =
      new Date();

    const requestId =
      randomUUID();

    const items =
      this.createItems(
        requestId,
        dto.items,
        now,
      );

    const estimatedAmount =
      this.calculateEstimatedAmount(
        items,
      );

    const request:
      PurchaseRequest = {
        id:
          requestId,

        requestNumber:
          this.createRequestNumber(),

        propertyId:
          dto.propertyId,

        zoneId:
          dto.zoneId,

        spaceId:
          dto.spaceId,

        categoryId:
          dto.categoryId,

        requestedByPersonId:
          dto.requestedByPersonId,

        title:
          dto.title.trim(),

        description:
          dto.description
            ?.trim() ||
          undefined,

        businessJustification:
          dto.businessJustification
            ?.trim() ||
          undefined,

        priority:
          dto.priority,

        status:
          PurchaseRequestStatus.DRAFT,

        requiredByDate:
          dto.requiredByDate
            ? this.parseDate(
                dto.requiredByDate,
                'requiredByDate',
              )
            : undefined,

        estimatedAmount,

        currency:
          (
            dto.currency ??
            'INR'
          )
            .trim()
            .toUpperCase(),

        metadata:
          dto.metadata ?? {},

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this.repository.create(
        request,
        items,
      );

    await this.repository.addHistory(
      this.createHistory(
        created.id,
        undefined,
        created.status,
        dto.requestedByPersonId,
        'Purchase request created',
      ),
    );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_CREATED,
      created,
      dto.requestedByPersonId,
    );

    return this.requireRequest(
      created.id,
    );
  }

  async list(
    filters:
      PurchaseRequestFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requireRequest(id);
  }

  async update(
    id: string,
    dto: UpdatePurchaseRequestDto,
  ) {
    const current =
      await this.requireRequest(id);

    if (
      current.status !==
      PurchaseRequestStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft purchase requests can be edited',
      );
    }

    if (
      dto.items &&
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'At least one purchase request item is required',
      );
    }

    const now =
      new Date();

    const items =
      dto.items
        ? this.createItems(
            id,
            dto.items,
            now,
          )
        : undefined;

    const estimatedAmount =
      items
        ? this.calculateEstimatedAmount(
            items,
          )
        : current.estimatedAmount;

    const updated:
      PurchaseRequest = {
        ...current,

        categoryId:
          dto.categoryId ??
          current.categoryId,

        zoneId:
          dto.zoneId ??
          current.zoneId,

        spaceId:
          dto.spaceId ??
          current.spaceId,

        title:
          dto.title !==
          undefined
            ? this.requireText(
                dto.title,
                'title',
              )
            : current.title,

        description:
          dto.description !==
          undefined
            ? dto.description
                .trim() ||
              undefined
            : current.description,

        businessJustification:
          dto.businessJustification !==
          undefined
            ? dto.businessJustification
                .trim() ||
              undefined
            : current.businessJustification,

        priority:
          dto.priority ??
          current.priority,

        requiredByDate:
          dto.requiredByDate
            ? this.parseDate(
                dto.requiredByDate,
                'requiredByDate',
              )
            : current.requiredByDate,

        estimatedAmount,

        currency:
          (
            dto.currency ??
            current.currency
          )
            .trim()
            .toUpperCase(),

        metadata:
          dto.metadata ??
          current.metadata,

        updatedAt:
          now,
      };

    const saved =
      await this.repository.update(
        updated,
        items,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_UPDATED,
      saved,
      dto.updatedByPersonId,
    );

    return saved;
  }

  async submit(
    id: string,
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.transition(
      id,
      [
        PurchaseRequestStatus.DRAFT,
      ],
      PurchaseRequestStatus.SUBMITTED,
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_SUBMITTED,
      dto.changedByPersonId,
      dto.remarks,
      {
        submittedAt:
          new Date(),
      },
    );
  }

  async approve(
    id: string,
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.transition(
      id,
      [
        PurchaseRequestStatus.SUBMITTED,
        PurchaseRequestStatus.UNDER_REVIEW,
      ],
      PurchaseRequestStatus.APPROVED,
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_APPROVED,
      dto.changedByPersonId,
      dto.remarks,
      {
        approvedAt:
          new Date(),

        approvedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async reject(
    id: string,
    dto: RejectPurchaseRequestDto,
  ) {
    const rejectionReason =
      this.requireText(
        dto.rejectionReason,
        'rejectionReason',
      );

    return this.transition(
      id,
      [
        PurchaseRequestStatus.SUBMITTED,
        PurchaseRequestStatus.UNDER_REVIEW,
      ],
      PurchaseRequestStatus.REJECTED,
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_REJECTED,
      dto.rejectedByPersonId,
      rejectionReason,
      {
        rejectedAt:
          new Date(),

        rejectedByPersonId:
          dto.rejectedByPersonId,

        rejectionReason,
      },
    );
  }

  async cancel(
    id: string,
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.transition(
      id,
      [
        PurchaseRequestStatus.DRAFT,
        PurchaseRequestStatus.SUBMITTED,
        PurchaseRequestStatus.UNDER_REVIEW,
        PurchaseRequestStatus.APPROVED,
      ],
      PurchaseRequestStatus.CANCELLED,
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_CANCELLED,
      dto.changedByPersonId,
      dto.remarks,
      {
        cancelledAt:
          new Date(),

        cancelledByPersonId:
          dto.changedByPersonId,

        cancellationReason:
          dto.remarks
            ?.trim() ||
          undefined,
      },
    );
  }

  async close(
    id: string,
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.transition(
      id,
      [
        PurchaseRequestStatus.APPROVED,
        PurchaseRequestStatus
          .CONVERTED_TO_RFQ,
        PurchaseRequestStatus
          .CONVERTED_TO_PO,
      ],
      PurchaseRequestStatus.CLOSED,
      PROCUREMENT_EVENTS
        .PURCHASE_REQUEST_CLOSED,
      dto.changedByPersonId,
      dto.remarks,
      {
        closedAt:
          new Date(),
      },
    );
  }

  async categories() {
    return this.repository
      .listCategories();
  }

  async metrics() {
    return this.repository
      .getMetrics();
  }

  private async transition(
    id: string,
    allowed:
      PurchaseRequestStatus[],
    toStatus:
      PurchaseRequestStatus,
    eventName: string,
    actorPersonId: string,
    remarks?: string,
    patch: Partial<
      PurchaseRequest
    > = {},
  ) {
    const current =
      await this.requireRequest(id);

    if (
      !allowed.includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Purchase request cannot transition from ${current.status} to ${toStatus}`,
      );
    }

    const updated:
      PurchaseRequest = {
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
        id,
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

    return this.requireRequest(
      saved.id,
    );
  }

  private async requireRequest(
    id: string,
  ) {
    const request =
      await this.repository
        .findById(id);

    if (!request) {
      throw new NotFoundException(
        `Purchase request not found: ${id}`,
      );
    }

    return request;
  }

  private validateCreateInput(
    dto: CreatePurchaseRequestDto,
  ) {
    this.requireText(
      dto.propertyId,
      'propertyId',
    );

    this.requireText(
      dto.categoryId,
      'categoryId',
    );

    this.requireText(
      dto.requestedByPersonId,
      'requestedByPersonId',
    );

    this.requireText(
      dto.title,
      'title',
    );

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'At least one purchase request item is required',
      );
    }
  }

  private createItems(
    purchaseRequestId: string,
    input:
      CreatePurchaseRequestDto[
        'items'
      ],
    now: Date,
  ): PurchaseRequestItem[] {
    return input.map(
      (
        item,
        index,
      ) => {
        const lineNumber =
          index + 1;

        const description =
          this.requireText(
            item.description,
            `items[${index}].description`,
          );

        const unit =
          this.requireText(
            item.unit,
            `items[${index}].unit`,
          );

        if (
          !Number.isFinite(
            item.quantity,
          ) ||
          item.quantity <= 0
        ) {
          throw new BadRequestException(
            `Invalid quantity for line ${lineNumber}`,
          );
        }

        if (
          item.estimatedUnitPrice !==
            undefined &&
          (
            !Number.isFinite(
              item.estimatedUnitPrice,
            ) ||
            item.estimatedUnitPrice <
              0
          )
        ) {
          throw new BadRequestException(
            `Invalid estimated unit price for line ${lineNumber}`,
          );
        }

        const estimatedAmount =
          item.estimatedUnitPrice ===
          undefined
            ? undefined
            : item.quantity *
              item.estimatedUnitPrice;

        return {
          id:
            randomUUID(),

          purchaseRequestId,

          lineNumber,

          itemType:
            item.itemType,

          itemCode:
            item.itemCode
              ?.trim() ||
            undefined,

          description,

          quantity:
            item.quantity,

          unit,

          estimatedUnitPrice:
            item.estimatedUnitPrice,

          estimatedAmount,

          specifications:
            item.specifications
              ?.trim() ||
            undefined,

          preferredVendorId:
            item.preferredVendorId,

          createdAt:
            now,

          updatedAt:
            now,
        };
      },
    );
  }

  private calculateEstimatedAmount(
    items: PurchaseRequestItem[],
  ) {
    return items.reduce(
      (
        total,
        item,
      ) =>
        total +
        (
          item.estimatedAmount ??
          0
        ),
      0,
    );
  }

  private createHistory(
    entityId: string,
    fromStatus:
      PurchaseRequestStatus |
      undefined,
    toStatus:
      PurchaseRequestStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'PURCHASE_REQUEST',

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
  ): Date {
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

  private requireText(
    value:
      string |
      undefined |
      null,
    field: string,
  ) {
    const normalized =
      value?.trim();

    if (!normalized) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }

    return normalized;
  }

  private createRequestNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `PR-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    request: PurchaseRequest,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...request,
      entityType:
        'procurement.purchase_request',
      entityId:
        request.id,
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
