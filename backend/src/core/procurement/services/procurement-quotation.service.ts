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
  CreateProcurementQuotationDto,
  CreateProcurementQuotationItemDto,
} from '../dto/create-procurement-quotation.dto';

import {
  TransitionProcurementQuotationDto,
} from '../dto/transition-procurement-quotation.dto';

import {
  UpdateProcurementQuotationDto,
} from '../dto/update-procurement-quotation.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_QUOTATION_REPOSITORY,
  ProcurementQuotationFilters,
  ProcurementQuotationRepository,
} from '../repositories/procurement-quotation.repository';

import {
  ProcurementQuotation,
  ProcurementQuotationItem,
  ProcurementStatusHistory,
  QuotationStatus,
  RfqStatus,
} from '../types/procurement.types';

import {
  ProcurementRfqService,
} from './procurement-rfq.service';

@Injectable()
export class ProcurementQuotationService {
  constructor(
    @Inject(
      PROCUREMENT_QUOTATION_REPOSITORY,
    )
    private readonly repository:
      ProcurementQuotationRepository,

    private readonly rfqService:
      ProcurementRfqService,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreateProcurementQuotationDto,
  ) {
    const rfq =
      await this.rfqService.get(
        dto.rfqId,
      );

    if (
      rfq.status !==
      RfqStatus.OPEN
    ) {
      throw new BadRequestException(
        `Quotation can only be created for an OPEN RFQ. Current status: ${rfq.status}`,
      );
    }

    const isInvited =
      await this.repository
        .isVendorInvited(
          dto.rfqId,
          dto.vendorId,
        );

    if (!isInvited) {
      throw new BadRequestException(
        `Vendor ${dto.vendorId} is not invited to RFQ ${dto.rfqId}`,
      );
    }

    const existing =
      await this.repository
        .findByRfqAndVendor(
          dto.rfqId,
          dto.vendorId,
        );

    if (existing) {
      throw new BadRequestException(
        'A quotation already exists for this vendor and RFQ',
      );
    }

    const rfqItemIds =
      await this.repository
        .listRfqItemIds(
          dto.rfqId,
        );

    const now =
      new Date();

    const quotationId =
      randomUUID();

    const items =
      this.createItems(
        quotationId,
        dto.items,
        rfqItemIds,
        now,
      );

    const totals =
      this.calculateTotals(
        items,
        dto.discountAmount ?? 0,
        dto.freightAmount ?? 0,
      );

    const quotation:
      ProcurementQuotation = {
        id:
          quotationId,

        quotationNumber:
          this.createQuotationNumber(),

        rfqId:
          dto.rfqId,

        vendorId:
          dto.vendorId,

        status:
          QuotationStatus.DRAFT,

        vendorReference:
          dto.vendorReference
            ?.trim() ||
          undefined,

        quotationDate:
          dto.quotationDate
            ? this.parseDate(
                dto.quotationDate,
                'quotationDate',
              )
            : now,

        validUntil:
          this.parseDate(
            dto.validUntil,
            'validUntil',
          ),

        deliveryDays:
          this.validateOptionalWholeNumber(
            dto.deliveryDays,
            'deliveryDays',
          ),

        subtotal:
          totals.subtotal,

        discountAmount:
          totals.discountAmount,

        taxAmount:
          totals.taxAmount,

        freightAmount:
          totals.freightAmount,

        totalAmount:
          totals.totalAmount,

        currency:
          (
            dto.currency ??
            rfq.currency ??
            'INR'
          )
            .trim()
            .toUpperCase(),

        paymentTerms:
          dto.paymentTerms
            ?.trim() ||
          undefined,

        deliveryTerms:
          dto.deliveryTerms
            ?.trim() ||
          undefined,

        notes:
          dto.notes
            ?.trim() ||
          undefined,

        createdAt:
          now,

        updatedAt:
          now,
      };

    this.validateQuotationDates(
      quotation.quotationDate,
      quotation.validUntil,
    );

    const created =
      await this.repository.create(
        quotation,
        items,
      );

    await this.repository.addHistory(
      this.createHistory(
        created.id,
        undefined,
        created.status,
        dto.submittedByPersonId,
        'Quotation created',
      ),
    );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .QUOTATION_CREATED,
      created,
      dto.submittedByPersonId,
    );

    return this.requireQuotation(
      created.id,
    );
  }

  async list(
    filters:
      ProcurementQuotationFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requireQuotation(id);
  }

  async update(
    id: string,
    dto: UpdateProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      current.status !==
      QuotationStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft quotations can be edited',
      );
    }

    const rfqItemIds =
      await this.repository
        .listRfqItemIds(
          current.rfqId,
        );

    const now =
      new Date();

    const items =
      dto.items
        ? this.createItems(
            current.id,
            dto.items,
            rfqItemIds,
            now,
          )
        : current.items;

    const totals =
      this.calculateTotals(
        items,
        dto.discountAmount ??
          current.discountAmount,
        dto.freightAmount ??
          current.freightAmount,
      );

    const quotationDate =
      dto.quotationDate
        ? this.parseDate(
            dto.quotationDate,
            'quotationDate',
          )
        : current.quotationDate;

    const validUntil =
      dto.validUntil
        ? this.parseDate(
            dto.validUntil,
            'validUntil',
          )
        : current.validUntil;

    this.validateQuotationDates(
      quotationDate,
      validUntil,
    );

    const updated:
      ProcurementQuotation = {
        ...current,

        vendorReference:
          dto.vendorReference !==
          undefined
            ? dto.vendorReference
                .trim() ||
              undefined
            : current.vendorReference,

        quotationDate,

        validUntil,

        deliveryDays:
          dto.deliveryDays !==
          undefined
            ? this.validateOptionalWholeNumber(
                dto.deliveryDays,
                'deliveryDays',
              )
            : current.deliveryDays,

        subtotal:
          totals.subtotal,

        discountAmount:
          totals.discountAmount,

        taxAmount:
          totals.taxAmount,

        freightAmount:
          totals.freightAmount,

        totalAmount:
          totals.totalAmount,

        currency:
          (
            dto.currency ??
            current.currency
          )
            .trim()
            .toUpperCase(),

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

        notes:
          dto.notes !==
          undefined
            ? dto.notes
                .trim() ||
              undefined
            : current.notes,

        updatedAt:
          now,
      };

    const saved =
      await this.repository.update(
        updated,
        dto.items
          ? items
          : undefined,
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .QUOTATION_UPDATED,
      saved,
      dto.updatedByPersonId,
    );

    return saved;
  }

  async submit(
    id: string,
    dto: TransitionProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      current.status !==
      QuotationStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Quotation cannot be submitted from ${current.status}`,
      );
    }

    const rfq =
      await this.rfqService.get(
        current.rfqId,
      );

    if (
      rfq.status !==
      RfqStatus.OPEN
    ) {
      throw new BadRequestException(
        `Quotation cannot be submitted because RFQ is ${rfq.status}`,
      );
    }

    if (
      current.validUntil
        .getTime() <
      Date.now()
    ) {
      throw new BadRequestException(
        'Quotation validity date has passed',
      );
    }

    const submitted =
      await this.transition(
        current,
        QuotationStatus.SUBMITTED,
        PROCUREMENT_EVENTS
          .QUOTATION_SUBMITTED,
        dto.changedByPersonId,
        dto.remarks,
        {
          submittedAt:
            new Date(),
        },
      );

    await this.rfqService
      .markVendorResponded(
        current.rfqId,
        current.vendorId,
      );

    return submitted;
  }

  async select(
    id: string,
    dto: TransitionProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      current.status !==
      QuotationStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Quotation cannot be selected from ${current.status}`,
      );
    }

    return this.transition(
      current,
      QuotationStatus.SELECTED,
      PROCUREMENT_EVENTS
        .QUOTATION_SELECTED,
      dto.changedByPersonId,
      dto.remarks,
      {
        selectedAt:
          new Date(),
      },
    );
  }

  async reject(
    id: string,
    dto: TransitionProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      current.status !==
      QuotationStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Quotation cannot be rejected from ${current.status}`,
      );
    }

    return this.transition(
      current,
      QuotationStatus.REJECTED,
      PROCUREMENT_EVENTS
        .QUOTATION_REJECTED,
      dto.changedByPersonId,
      dto.remarks,
      {
        rejectedAt:
          new Date(),
      },
    );
  }

  async withdraw(
    id: string,
    dto: TransitionProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      ![
        QuotationStatus.DRAFT,
        QuotationStatus.SUBMITTED,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Quotation cannot be withdrawn from ${current.status}`,
      );
    }

    return this.transition(
      current,
      QuotationStatus.WITHDRAWN,
      PROCUREMENT_EVENTS
        .QUOTATION_WITHDRAWN,
      dto.changedByPersonId,
      dto.remarks,
      {
        withdrawnAt:
          new Date(),
      },
    );
  }

  async expire(
    id: string,
    dto: TransitionProcurementQuotationDto,
  ) {
    const current =
      await this.requireQuotation(id);

    if (
      ![
        QuotationStatus.DRAFT,
        QuotationStatus.SUBMITTED,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Quotation cannot expire from ${current.status}`,
      );
    }

    if (
      current.validUntil
        .getTime() >
      Date.now()
    ) {
      throw new BadRequestException(
        'Quotation cannot expire before validUntil',
      );
    }

    return this.transition(
      current,
      QuotationStatus.EXPIRED,
      PROCUREMENT_EVENTS
        .QUOTATION_EXPIRED,
      dto.changedByPersonId,
      dto.remarks,
      {
        expiredAt:
          new Date(),
      },
    );
  }

  private async transition(
    current:
      ProcurementQuotation & {
        items:
          ProcurementQuotationItem[];
        history:
          ProcurementStatusHistory[];
      },
    toStatus:
      QuotationStatus,
    eventName: string,
    actorPersonId: string,
    remarks?: string,
    patch: Partial<
      ProcurementQuotation
    > = {},
  ) {
    const updated:
      ProcurementQuotation = {
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

    return this.requireQuotation(
      saved.id,
    );
  }

  private createItems(
    quotationId: string,
    input:
      CreateProcurementQuotationItemDto[],
    allowedRfqItemIds: string[],
    now: Date,
  ): ProcurementQuotationItem[] {
    if (
      !input ||
      input.length === 0
    ) {
      throw new BadRequestException(
        'At least one quotation item is required',
      );
    }

    const allowed =
      new Set(
        allowedRfqItemIds,
      );

    const used =
      new Set<string>();

    return input.map(
      (
        item,
        index,
      ) => {
        if (
          !allowed.has(
            item.rfqItemId,
          )
        ) {
          throw new BadRequestException(
            `Quotation item ${item.rfqItemId} does not belong to the RFQ`,
          );
        }

        if (
          used.has(
            item.rfqItemId,
          )
        ) {
          throw new BadRequestException(
            `Duplicate RFQ item: ${item.rfqItemId}`,
          );
        }

        used.add(
          item.rfqItemId,
        );

        const quantity =
          this.validatePositiveNumber(
            item.quantity,
            `items[${index}].quantity`,
          );

        const unitPrice =
          this.validatePositiveNumber(
            item.unitPrice,
            `items[${index}].unitPrice`,
          );

        const discountAmount =
          this.validateNonNegativeNumber(
            item.discountAmount ??
              0,
            `items[${index}].discountAmount`,
          );

        const taxRate =
          this.validateNonNegativeNumber(
            item.taxRate ??
              0,
            `items[${index}].taxRate`,
          );

        const baseAmount =
          this.roundMoney(
            quantity *
              unitPrice,
          );

        if (
          discountAmount >
          baseAmount
        ) {
          throw new BadRequestException(
            `Discount exceeds base amount for quotation line ${index + 1}`,
          );
        }

        const taxableAmount =
          this.roundMoney(
            baseAmount -
              discountAmount,
          );

        const taxAmount =
          this.roundMoney(
            taxableAmount *
              taxRate /
              100,
          );

        const lineTotal =
          this.roundMoney(
            taxableAmount +
              taxAmount,
          );

        return {
          id:
            randomUUID(),

          quotationId,

          rfqItemId:
            item.rfqItemId,

          lineNumber:
            index + 1,

          description:
            item.description
              ?.trim() ||
            undefined,

          quantity,

          unit:
            this.requireText(
              item.unit,
              `items[${index}].unit`,
            ),

          unitPrice,

          discountAmount,

          taxRate,

          taxAmount,

          lineTotal,

          deliveryDays:
            this.validateOptionalWholeNumber(
              item.deliveryDays,
              `items[${index}].deliveryDays`,
            ),

          remarks:
            item.remarks
              ?.trim() ||
            undefined,

          createdAt:
            now,

          updatedAt:
            now,
        };
      },
    );
  }

  private calculateTotals(
    items:
      ProcurementQuotationItem[],
    headerDiscount: number,
    freightAmount: number,
  ) {
    const subtotal =
      this.roundMoney(
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            (
              item.quantity *
              item.unitPrice
            ),
          0,
        ),
      );

    const lineDiscount =
      this.roundMoney(
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.discountAmount,
          0,
        ),
      );

    const validatedHeaderDiscount =
      this.validateNonNegativeNumber(
        headerDiscount,
        'discountAmount',
      );

    const discountAmount =
      this.roundMoney(
        lineDiscount +
          validatedHeaderDiscount,
      );

    if (
      discountAmount >
      subtotal
    ) {
      throw new BadRequestException(
        'Total discount cannot exceed subtotal',
      );
    }

    const taxAmount =
      this.roundMoney(
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.taxAmount,
          0,
        ),
      );

    const validatedFreight =
      this.validateNonNegativeNumber(
        freightAmount,
        'freightAmount',
      );

    const totalAmount =
      this.roundMoney(
        subtotal -
          discountAmount +
          taxAmount +
          validatedFreight,
      );

    if (
      totalAmount < 0
    ) {
      throw new BadRequestException(
        'Quotation total cannot be negative',
      );
    }

    return {
      subtotal,
      discountAmount,
      taxAmount,
      freightAmount:
        validatedFreight,
      totalAmount,
    };
  }

  private async requireQuotation(
    id: string,
  ) {
    const quotation =
      await this.repository
        .findById(id);

    if (!quotation) {
      throw new NotFoundException(
        `Quotation not found: ${id}`,
      );
    }

    return quotation;
  }

  private createHistory(
    entityId: string,
    fromStatus:
      QuotationStatus |
      undefined,
    toStatus:
      QuotationStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'QUOTATION',

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

  private validateQuotationDates(
    quotationDate: Date,
    validUntil: Date,
  ) {
    if (
      validUntil.getTime() <
      quotationDate.getTime()
    ) {
      throw new BadRequestException(
        'validUntil cannot be before quotationDate',
      );
    }
  }

  private validatePositiveNumber(
    value: number,
    field: string,
  ) {
    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new BadRequestException(
        `${field} must be greater than zero`,
      );
    }

    return value;
  }

  private validateNonNegativeNumber(
    value: number,
    field: string,
  ) {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new BadRequestException(
        `${field} cannot be negative`,
      );
    }

    return value;
  }

  private validateOptionalWholeNumber(
    value:
      number |
      undefined,
    field: string,
  ) {
    if (
      value === undefined
    ) {
      return undefined;
    }

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new BadRequestException(
        `${field} must be a non-negative integer`,
      );
    }

    return value;
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

  private roundMoney(
    value: number,
  ) {
    return Math.round(
      (
        value +
        Number.EPSILON
      ) *
      100,
    ) / 100;
  }

  private createQuotationNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `QT-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    quotation:
      ProcurementQuotation,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...quotation,

      entityType:
        'procurement.quotation',

      entityId:
        quotation.id,

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
