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
  CreateProcurementRfqDto,
} from '../dto/create-procurement-rfq.dto';

import {
  DeclineProcurementRfqDto,
} from '../dto/decline-procurement-rfq.dto';

import {
  TransitionProcurementRfqDto,
} from '../dto/transition-procurement-rfq.dto';

import {
  UpdateProcurementRfqDto,
} from '../dto/update-procurement-rfq.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_RFQ_REPOSITORY,
  ProcurementRfqFilters,
  ProcurementRfqRepository,
} from '../repositories/procurement-rfq.repository';

import {
  ProcurementRfq,
  ProcurementRfqItem,
  ProcurementRfqVendor,
  ProcurementStatusHistory,
  PurchaseRequestStatus,
  RfqStatus,
  RfqVendorStatus,
} from '../types/procurement.types';

import {
  PurchaseRequestService,
} from './purchase-request.service';

@Injectable()
export class ProcurementRfqService {
  constructor(
    @Inject(
      PROCUREMENT_RFQ_REPOSITORY,
    )
    private readonly repository:
      ProcurementRfqRepository,

    private readonly purchaseRequestService:
      PurchaseRequestService,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreateProcurementRfqDto,
  ) {
    const purchaseRequest =
      await this.purchaseRequestService.get(
        dto.purchaseRequestId,
      );

    if (
      purchaseRequest.status !==
      PurchaseRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        `RFQ can only be created from an APPROVED purchase request. Current status: ${purchaseRequest.status}`,
      );
    }

    const existing =
      await this.repository
        .findByPurchaseRequestId(
          dto.purchaseRequestId,
        );

    if (existing) {
      throw new BadRequestException(
        `An RFQ already exists for purchase request ${dto.purchaseRequestId}`,
      );
    }

    const vendorIds =
      this.normalizeVendorIds(
        dto.vendorIds,
      );

    await this.validateActiveVendors(
      vendorIds,
    );

    const quotationDeadline =
      this.parseDate(
        dto.quotationDeadline,
        'quotationDeadline',
      );

    if (
      quotationDeadline.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'quotationDeadline must be in the future',
      );
    }

    const deliveryRequiredBy =
      dto.deliveryRequiredBy
        ? this.parseDate(
            dto.deliveryRequiredBy,
            'deliveryRequiredBy',
          )
        : undefined;

    if (
      deliveryRequiredBy &&
      deliveryRequiredBy.getTime() <
        quotationDeadline.getTime()
    ) {
      throw new BadRequestException(
        'deliveryRequiredBy cannot be before quotationDeadline',
      );
    }

    const now =
      new Date();

    const rfqId =
      randomUUID();

    const rfq:
      ProcurementRfq = {
        id:
          rfqId,

        rfqNumber:
          this.createRfqNumber(),

        purchaseRequestId:
          purchaseRequest.id,

        propertyId:
          purchaseRequest.propertyId,

        title:
          this.requireText(
            dto.title,
            'title',
          ),

        description:
          dto.description
            ?.trim() ||
          undefined,

        status:
          RfqStatus.DRAFT,

        quotationDeadline,

        deliveryRequiredBy,

        currency:
          (
            dto.currency ??
            purchaseRequest.currency ??
            'INR'
          )
            .trim()
            .toUpperCase(),

        termsAndConditions:
          dto.termsAndConditions
            ?.trim() ||
          undefined,

        createdByPersonId:
          dto.createdByPersonId,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const items:
      ProcurementRfqItem[] =
      purchaseRequest.items.map(
        (
          item,
          index,
        ) => ({
          id:
            randomUUID(),

          rfqId,

          purchaseRequestItemId:
            item.id,

          lineNumber:
            index + 1,

          itemType:
            item.itemType,

          itemCode:
            item.itemCode,

          description:
            item.description,

          quantity:
            item.quantity,

          unit:
            item.unit,

          specifications:
            item.specifications,

          createdAt:
            now,
        }),
      );

    if (
      items.length === 0
    ) {
      throw new BadRequestException(
        'Purchase request has no items to copy into the RFQ',
      );
    }

    const vendors:
      ProcurementRfqVendor[] =
      vendorIds.map(
        (
          vendorId,
        ) => ({
          id:
            randomUUID(),

          rfqId,

          vendorId,

          status:
            RfqVendorStatus.INVITED,

          invitedAt:
            now,
        }),
      );

    const created =
      await this.repository.create(
        rfq,
        items,
        vendors,
      );

    await this.repository.addHistory(
      this.createHistory(
        created.id,
        undefined,
        created.status,
        dto.createdByPersonId,
        'RFQ created',
      ),
    );

    await this.purchaseRequestService
      .markConvertedToRfq(
        purchaseRequest.id,
        dto.createdByPersonId,
        created.id,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS.RFQ_CREATED,
      created,
      dto.createdByPersonId,
    );

    return this.requireRfq(
      created.id,
    );
  }

  async list(
    filters:
      ProcurementRfqFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requireRfq(id);
  }

  async update(
    id: string,
    dto: UpdateProcurementRfqDto,
  ) {
    const current =
      await this.requireRfq(id);

    if (
      current.status !==
      RfqStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft RFQs can be edited',
      );
    }

    const quotationDeadline =
      dto.quotationDeadline
        ? this.parseDate(
            dto.quotationDeadline,
            'quotationDeadline',
          )
        : current.quotationDeadline;

    if (
      quotationDeadline.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'quotationDeadline must be in the future',
      );
    }

    const deliveryRequiredBy =
      dto.deliveryRequiredBy
        ? this.parseDate(
            dto.deliveryRequiredBy,
            'deliveryRequiredBy',
          )
        : current.deliveryRequiredBy;

    if (
      deliveryRequiredBy &&
      deliveryRequiredBy.getTime() <
        quotationDeadline.getTime()
    ) {
      throw new BadRequestException(
        'deliveryRequiredBy cannot be before quotationDeadline',
      );
    }

    let vendors:
      ProcurementRfqVendor[] |
      undefined;

    if (dto.vendorIds) {
      const vendorIds =
        this.normalizeVendorIds(
          dto.vendorIds,
        );

      await this.validateActiveVendors(
        vendorIds,
      );

      const existingByVendorId =
        new Map(
          current.vendors.map(
            (
              vendor,
            ) => [
              vendor.vendorId,
              vendor,
            ],
          ),
        );

      const now =
        new Date();

      vendors =
        vendorIds.map(
          (
            vendorId,
          ) => {
            const existing =
              existingByVendorId.get(
                vendorId,
              );

            if (existing) {
              return existing;
            }

            return {
              id:
                randomUUID(),

              rfqId:
                current.id,

              vendorId,

              status:
                RfqVendorStatus.INVITED,

              invitedAt:
                now,
            };
          },
        );
    }

    const updated:
      ProcurementRfq = {
        ...current,

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

        quotationDeadline,

        deliveryRequiredBy,

        currency:
          (
            dto.currency ??
            current.currency
          )
            .trim()
            .toUpperCase(),

        termsAndConditions:
          dto.termsAndConditions !==
          undefined
            ? dto.termsAndConditions
                .trim() ||
              undefined
            : current
                .termsAndConditions,

        updatedAt:
          new Date(),
      };

    const saved =
      await this.repository.update(
        updated,
        undefined,
        vendors,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS.RFQ_UPDATED,
      saved,
      dto.updatedByPersonId,
    );

    return saved;
  }

  async issue(
    id: string,
    dto: TransitionProcurementRfqDto,
  ) {
    const now =
      new Date();

    const current =
      await this.requireRfq(id);

    if (
      current.status !==
      RfqStatus.DRAFT
    ) {
      throw new BadRequestException(
        `RFQ cannot be issued from ${current.status}`,
      );
    }

    if (
      current.quotationDeadline
        .getTime() <=
      now.getTime()
    ) {
      throw new BadRequestException(
        'RFQ quotation deadline has already passed',
      );
    }

    if (
      current.vendors.length === 0
    ) {
      throw new BadRequestException(
        'RFQ must contain at least one invited vendor',
      );
    }

    return this.transition(
      current,
      RfqStatus.OPEN,
      PROCUREMENT_EVENTS.RFQ_ISSUED,
      dto.changedByPersonId,
      dto.remarks,
      {
        issueDate:
          now,

        issuedAt:
          now,

        issuedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async close(
    id: string,
    dto: TransitionProcurementRfqDto,
  ) {
    const current =
      await this.requireRfq(id);

    if (
      current.status !==
      RfqStatus.OPEN
    ) {
      throw new BadRequestException(
        `RFQ cannot be closed from ${current.status}`,
      );
    }

    return this.transition(
      current,
      RfqStatus.CLOSED,
      PROCUREMENT_EVENTS.RFQ_CLOSED,
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
    dto: TransitionProcurementRfqDto,
  ) {
    const current =
      await this.requireRfq(id);

    if (
      ![
        RfqStatus.DRAFT,
        RfqStatus.ISSUED,
        RfqStatus.OPEN,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `RFQ cannot be cancelled from ${current.status}`,
      );
    }

    return this.transition(
      current,
      RfqStatus.CANCELLED,
      PROCUREMENT_EVENTS.RFQ_CANCELLED,
      dto.changedByPersonId,
      dto.remarks,
      {
        cancelledAt:
          new Date(),
      },
    );
  }

  async expire(
    id: string,
    dto: TransitionProcurementRfqDto,
  ) {
    const current =
      await this.requireRfq(id);

    if (
      current.status !==
      RfqStatus.OPEN
    ) {
      throw new BadRequestException(
        `RFQ cannot expire from ${current.status}`,
      );
    }

    if (
      current.quotationDeadline
        .getTime() >
      Date.now()
    ) {
      throw new BadRequestException(
        'RFQ cannot expire before its quotation deadline',
      );
    }

    return this.transition(
      current,
      RfqStatus.EXPIRED,
      PROCUREMENT_EVENTS.RFQ_EXPIRED,
      dto.changedByPersonId,
      dto.remarks,
      {
        expiredAt:
          new Date(),
      },
    );
  }

  async markVendorViewed(
    id: string,
    vendorId: string,
  ) {
    const rfq =
      await this.requireRfq(id);

    this.requireVendorInvitation(
      rfq,
      vendorId,
    );

    if (
      ![
        RfqStatus.ISSUED,
        RfqStatus.OPEN,
      ].includes(
        rfq.status,
      )
    ) {
      throw new BadRequestException(
        `Vendor cannot view RFQ in ${rfq.status} status`,
      );
    }

    const updated =
      await this.repository
        .markVendorViewed(
          id,
          vendorId,
          new Date(),
        );

    if (!updated) {
      throw new NotFoundException(
        `RFQ vendor invitation not found: ${vendorId}`,
      );
    }

    await this.publishVendorAction(
      PROCUREMENT_EVENTS
        .RFQ_VENDOR_VIEWED,
      rfq,
      updated,
    );

    return updated;
  }

  async markVendorResponded(
    id: string,
    vendorId: string,
  ) {
    const rfq =
      await this.requireRfq(id);

    const invitation =
      this.requireVendorInvitation(
        rfq,
        vendorId,
      );

    if (
      rfq.status !==
      RfqStatus.OPEN
    ) {
      throw new BadRequestException(
        `Vendor cannot respond to RFQ in ${rfq.status} status`,
      );
    }

    if (
      invitation.status ===
      RfqVendorStatus.DECLINED
    ) {
      throw new BadRequestException(
        'A declined vendor invitation cannot be marked as responded',
      );
    }

    const updated =
      await this.repository
        .markVendorResponded(
          id,
          vendorId,
          new Date(),
        );

    if (!updated) {
      throw new NotFoundException(
        `RFQ vendor invitation not found: ${vendorId}`,
      );
    }

    await this.publishVendorAction(
      PROCUREMENT_EVENTS
        .RFQ_VENDOR_RESPONDED,
      rfq,
      updated,
    );

    return updated;
  }

  async declineVendor(
    id: string,
    dto: DeclineProcurementRfqDto,
  ) {
    const rfq =
      await this.requireRfq(id);

    const invitation =
      this.requireVendorInvitation(
        rfq,
        dto.vendorId,
      );

    if (
      ![
        RfqStatus.ISSUED,
        RfqStatus.OPEN,
      ].includes(
        rfq.status,
      )
    ) {
      throw new BadRequestException(
        `Vendor cannot decline RFQ in ${rfq.status} status`,
      );
    }

    if (
      invitation.status ===
      RfqVendorStatus.RESPONDED
    ) {
      throw new BadRequestException(
        'A responded vendor invitation cannot be declined',
      );
    }

    const declineReason =
      this.requireText(
        dto.declineReason,
        'declineReason',
      );

    const updated =
      await this.repository
        .markVendorDeclined(
          id,
          dto.vendorId,
          new Date(),
          declineReason,
        );

    if (!updated) {
      throw new NotFoundException(
        `RFQ vendor invitation not found: ${dto.vendorId}`,
      );
    }

    await this.publishVendorAction(
      PROCUREMENT_EVENTS
        .RFQ_VENDOR_DECLINED,
      rfq,
      updated,
      declineReason,
    );

    return updated;
  }

  private async transition(
    current:
      ProcurementRfq & {
        items: ProcurementRfqItem[];
        vendors: ProcurementRfqVendor[];
        history: ProcurementStatusHistory[];
      },
    toStatus: RfqStatus,
    eventName: string,
    actorPersonId: string,
    remarks?: string,
    patch: Partial<
      ProcurementRfq
    > = {},
  ) {
    const updated:
      ProcurementRfq = {
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

    return this.requireRfq(
      saved.id,
    );
  }

  private async requireRfq(
    id: string,
  ) {
    const rfq =
      await this.repository
        .findById(id);

    if (!rfq) {
      throw new NotFoundException(
        `RFQ not found: ${id}`,
      );
    }

    return rfq;
  }

  private requireVendorInvitation(
    rfq: {
      vendors:
        ProcurementRfqVendor[];
    },
    vendorId: string,
  ) {
    const invitation =
      rfq.vendors.find(
        (
          vendor,
        ) =>
          vendor.vendorId ===
          vendorId,
      );

    if (!invitation) {
      throw new NotFoundException(
        `Vendor ${vendorId} is not invited to this RFQ`,
      );
    }

    return invitation;
  }

  private normalizeVendorIds(
    vendorIds:
      string[] |
      undefined,
  ) {
    if (
      !vendorIds ||
      vendorIds.length === 0
    ) {
      throw new BadRequestException(
        'At least one vendor must be invited',
      );
    }

    const normalized =
      vendorIds.map(
        (
          vendorId,
        ) =>
          this.requireText(
            vendorId,
            'vendorId',
          ),
      );

    const unique =
      Array.from(
        new Set(normalized),
      );

    if (
      unique.length !==
      normalized.length
    ) {
      throw new BadRequestException(
        'Duplicate vendor invitations are not allowed',
      );
    }

    return unique;
  }

  private async validateActiveVendors(
    vendorIds: string[],
  ) {
    const activeVendorIds =
      await this.repository
        .findActiveVendorIds(
          vendorIds,
        );

    const activeSet =
      new Set(
        activeVendorIds,
      );

    const invalidVendorIds =
      vendorIds.filter(
        (
          vendorId,
        ) =>
          !activeSet.has(
            vendorId,
          ),
      );

    if (
      invalidVendorIds.length >
      0
    ) {
      throw new BadRequestException(
        `Inactive or missing vendors: ${invalidVendorIds.join(', ')}`,
      );
    }
  }

  private createHistory(
    entityId: string,
    fromStatus:
      RfqStatus |
      undefined,
    toStatus: RfqStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'RFQ',

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

  private createRfqNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `RFQ-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    rfq: ProcurementRfq,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...rfq,

      entityType:
        'procurement.rfq',

      entityId:
        rfq.id,

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

  private async publishVendorAction(
    eventName: string,
    rfq: ProcurementRfq,
    vendor:
      ProcurementRfqVendor,
    remarks?: string,
  ) {
    const payload = {
      rfqId:
        rfq.id,

      rfqNumber:
        rfq.rfqNumber,

      purchaseRequestId:
        rfq.purchaseRequestId,

      propertyId:
        rfq.propertyId,

      vendorId:
        vendor.vendorId,

      invitationStatus:
        vendor.status,

      remarks,

      entityType:
        'procurement.rfq',

      entityId:
        rfq.id,

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
