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
  ApproveProcurementPaymentRequestDto,
} from '../dto/approve-procurement-payment-request.dto';

import {
  CancelProcurementPaymentRequestDto,
} from '../dto/cancel-procurement-payment-request.dto';

import {
  CreateProcurementPaymentRequestDto,
} from '../dto/create-procurement-payment-request.dto';

import {
  PayProcurementPaymentRequestDto,
} from '../dto/pay-procurement-payment-request.dto';

import {
  RejectProcurementPaymentRequestDto,
} from '../dto/reject-procurement-payment-request.dto';

import {
  SubmitProcurementPaymentRequestDto,
} from '../dto/submit-procurement-payment-request.dto';

import {
  UpdateProcurementPaymentRequestDto,
} from '../dto/update-procurement-payment-request.dto';

import {
  PROCUREMENT_EVENTS,
} from '../procurement.constants';

import {
  PROCUREMENT_INVOICE_MATCH_REPOSITORY,
  ProcurementInvoiceMatchRepository,
} from '../repositories/procurement-invoice-match.repository';

import {
  PROCUREMENT_PAYMENT_REQUEST_REPOSITORY,
  ProcurementPaymentRequestFilters,
  ProcurementPaymentRequestRepository,
} from '../repositories/procurement-payment-request.repository';

import {
  InvoiceMatchStatus,
  PaymentRequestStatus,
  ProcurementPaymentRequest,
  ProcurementStatusHistory,
} from '../types/procurement.types';

@Injectable()
export class ProcurementPaymentRequestService {
  constructor(
    @Inject(
      PROCUREMENT_PAYMENT_REQUEST_REPOSITORY,
    )
    private readonly repository:
      ProcurementPaymentRequestRepository,

    @Inject(
      PROCUREMENT_INVOICE_MATCH_REPOSITORY,
    )
    private readonly invoiceMatchRepository:
      ProcurementInvoiceMatchRepository,

    private readonly auditService:
      AuditService,

    private readonly eventBus:
      EventBusService,
  ) {}

  async create(
    dto: CreateProcurementPaymentRequestDto,
  ) {
    const invoiceMatch =
      await this.requireInvoiceMatch(
        dto.invoiceMatchId,
      );

    if (
      invoiceMatch.status !==
      InvoiceMatchStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Payment Request requires an approved Invoice Match',
      );
    }

    const existing =
      await this.repository
        .findActiveByInvoiceMatchId(
          invoiceMatch.id,
        );

    if (existing) {
      throw new BadRequestException(
        'An active Payment Request already exists for this Invoice Match',
      );
    }

    const requestedAmount =
      dto.requestedAmount !==
      undefined
        ? this.requirePositiveAmount(
            dto.requestedAmount,
            'requestedAmount',
          )
        : this.requirePositiveAmount(
            invoiceMatch.invoiceAmount,
            'invoiceAmount',
          );

    if (
      requestedAmount >
      invoiceMatch.invoiceAmount
    ) {
      throw new BadRequestException(
        'requestedAmount cannot exceed the approved Invoice Match amount',
      );
    }

    const currency =
      dto.currency
        ?.trim()
        .toUpperCase() ||
      'INR';

    if (
      currency.length > 10
    ) {
      throw new BadRequestException(
        'currency cannot exceed 10 characters',
      );
    }

    const now =
      new Date();

    const paymentRequest:
      ProcurementPaymentRequest = {
        id:
          randomUUID(),

        paymentRequestNumber:
          this.createPaymentRequestNumber(),

        vendorId:
          invoiceMatch.vendorId,

        propertyId:
          invoiceMatch.propertyId,

        purchaseOrderId:
          invoiceMatch.purchaseOrderId,

        invoiceMatchId:
          invoiceMatch.id,

        requestedAmount,

        currency,

        dueDate:
          dto.dueDate
            ? this.parseDate(
                dto.dueDate,
                'dueDate',
              )
            : undefined,

        status:
          PaymentRequestStatus.DRAFT,

        requestedByPersonId:
          dto.requestedByPersonId,

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
        paymentRequest,
        this.createHistory(
          paymentRequest.id,
          undefined,
          PaymentRequestStatus.DRAFT,
          dto.requestedByPersonId,
          'Payment Request created',
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_CREATED,
      created,
      dto.requestedByPersonId,
      dto.remarks,
    );

    return created;
  }

  async list(
    filters:
      ProcurementPaymentRequestFilters = {},
  ) {
    return this.repository.list(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    return this.requirePaymentRequest(
      id,
    );
  }

  async update(
    id: string,
    dto: UpdateProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      current.status !==
      PaymentRequestStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft Payment Requests can be edited',
      );
    }

    let requestedAmount =
      current.requestedAmount;

    if (
      dto.requestedAmount !==
      undefined
    ) {
      requestedAmount =
        this.requirePositiveAmount(
          dto.requestedAmount,
          'requestedAmount',
        );

      if (current.invoiceMatchId) {
        const invoiceMatch =
          await this.requireInvoiceMatch(
            current.invoiceMatchId,
          );

        if (
          requestedAmount >
          invoiceMatch.invoiceAmount
        ) {
          throw new BadRequestException(
            'requestedAmount cannot exceed the approved Invoice Match amount',
          );
        }
      }
    }

    const currency =
      dto.currency !==
      undefined
        ? dto.currency
            .trim()
            .toUpperCase()
        : current.currency;

    if (!currency) {
      throw new BadRequestException(
        'currency is required',
      );
    }

    if (
      currency.length > 10
    ) {
      throw new BadRequestException(
        'currency cannot exceed 10 characters',
      );
    }

    const updated:
      ProcurementPaymentRequest = {
        ...current,

        requestedAmount,

        currency,

        dueDate:
          dto.dueDate !==
          undefined
            ? this.parseDate(
                dto.dueDate,
                'dueDate',
              )
            : current.dueDate,

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
    );
  }

  async submit(
    id: string,
    dto: SubmitProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      current.status !==
      PaymentRequestStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Payment Request cannot be submitted from ${current.status}`,
      );
    }

    const now =
      new Date();

    const submitted:
      ProcurementPaymentRequest = {
        ...current,

        status:
          PaymentRequestStatus.SUBMITTED,

        submittedAt:
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
        submitted,
        this.createHistory(
          current.id,
          current.status,
          PaymentRequestStatus.SUBMITTED,
          dto.submittedByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_SUBMITTED,
      transitioned,
      dto.submittedByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  async approve(
    id: string,
    dto: ApproveProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      current.status !==
      PaymentRequestStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Payment Request cannot be approved from ${current.status}`,
      );
    }

    const approvedAmount =
      dto.approvedAmount !==
      undefined
        ? this.requirePositiveAmount(
            dto.approvedAmount,
            'approvedAmount',
          )
        : current.requestedAmount;

    if (
      approvedAmount >
      current.requestedAmount
    ) {
      throw new BadRequestException(
        'approvedAmount cannot exceed requestedAmount',
      );
    }

    const now =
      new Date();

    const approved:
      ProcurementPaymentRequest = {
        ...current,

        status:
          PaymentRequestStatus.APPROVED,

        approvedAmount,

        approvedByPersonId:
          dto.approvedByPersonId,

        approvedAt:
          now,

        rejectionReason:
          undefined,

        rejectedByPersonId:
          undefined,

        rejectedAt:
          undefined,

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
          PaymentRequestStatus.APPROVED,
          dto.approvedByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_APPROVED,
      transitioned,
      dto.approvedByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  async reject(
    id: string,
    dto: RejectProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      current.status !==
      PaymentRequestStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Payment Request cannot be rejected from ${current.status}`,
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
      ProcurementPaymentRequest = {
        ...current,

        status:
          PaymentRequestStatus.REJECTED,

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
          PaymentRequestStatus.REJECTED,
          dto.rejectedByPersonId,
          rejectionReason,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_REJECTED,
      transitioned,
      dto.rejectedByPersonId,
      rejectionReason,
    );

    return transitioned;
  }

  async cancel(
    id: string,
    dto: CancelProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      ![
        PaymentRequestStatus.DRAFT,
        PaymentRequestStatus.SUBMITTED,
        PaymentRequestStatus.APPROVED,
      ].includes(
        current.status,
      )
    ) {
      throw new BadRequestException(
        `Payment Request cannot be cancelled from ${current.status}`,
      );
    }

    const now =
      new Date();

    const cancelled:
      ProcurementPaymentRequest = {
        ...current,

        status:
          PaymentRequestStatus.CANCELLED,

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
        cancelled,
        this.createHistory(
          current.id,
          current.status,
          PaymentRequestStatus.CANCELLED,
          dto.cancelledByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_CANCELLED,
      transitioned,
      dto.cancelledByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  async pay(
    id: string,
    dto: PayProcurementPaymentRequestDto,
  ) {
    const current =
      await this.requirePaymentRequest(
        id,
      );

    if (
      current.status !==
      PaymentRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Payment Request cannot be paid from ${current.status}`,
      );
    }

    const approvedAmount =
      current.approvedAmount;

    if (
      approvedAmount ===
      undefined
    ) {
      throw new BadRequestException(
        'Payment Request has no approved amount',
      );
    }

    const paidAmount =
      dto.paidAmount !==
      undefined
        ? this.requirePositiveAmount(
            dto.paidAmount,
            'paidAmount',
          )
        : approvedAmount;

    if (
      paidAmount >
      approvedAmount
    ) {
      throw new BadRequestException(
        'paidAmount cannot exceed approvedAmount',
      );
    }

    const paymentReference =
      dto.paymentReference
        ?.trim();

    if (!paymentReference) {
      throw new BadRequestException(
        'paymentReference is required',
      );
    }

    if (
      paymentReference.length >
      200
    ) {
      throw new BadRequestException(
        'paymentReference cannot exceed 200 characters',
      );
    }

    const now =
      new Date();

    const paid:
      ProcurementPaymentRequest = {
        ...current,

        status:
          PaymentRequestStatus.PAID,

        paidAmount,

        paidByPersonId:
          dto.paidByPersonId,

        paidAt:
          now,

        paymentReference,

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
        paid,
        this.createHistory(
          current.id,
          current.status,
          PaymentRequestStatus.PAID,
          dto.paidByPersonId,
          dto.remarks,
        ),
      );

    await this.publishAndAudit(
      PROCUREMENT_EVENTS
        .PAYMENT_REQUEST_PAID,
      transitioned,
      dto.paidByPersonId,
      dto.remarks,
    );

    return transitioned;
  }

  private async requireInvoiceMatch(
    id: string,
  ) {
    const invoiceMatch =
      await this.invoiceMatchRepository
        .findById(id);

    if (!invoiceMatch) {
      throw new NotFoundException(
        `Invoice Match not found: ${id}`,
      );
    }

    return invoiceMatch;
  }

  private async requirePaymentRequest(
    id: string,
  ) {
    const paymentRequest =
      await this.repository
        .findById(id);

    if (!paymentRequest) {
      throw new NotFoundException(
        `Payment Request not found: ${id}`,
      );
    }

    return paymentRequest;
  }

  private createHistory(
    entityId: string,
    fromStatus:
      PaymentRequestStatus |
      undefined,
    toStatus:
      PaymentRequestStatus,
    changedByPersonId: string,
    remarks?: string,
  ): ProcurementStatusHistory {
    return {
      id:
        randomUUID(),

      entityType:
        'PAYMENT_REQUEST',

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

  private requirePositiveAmount(
    value: number,
    field: string,
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number) ||
      number <= 0
    ) {
      throw new BadRequestException(
        `${field} must be greater than zero`,
      );
    }

    return this.roundMoney(
      number,
    );
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

  private createPaymentRequestNumber() {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(
          /-/g,
          '',
        );

    return `PAY-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private async publishAndAudit(
    eventName: string,
    paymentRequest:
      ProcurementPaymentRequest,
    actorPersonId: string,
    remarks?: string,
  ) {
    const payload = {
      ...paymentRequest,

      entityType:
        'procurement.payment_request',

      entityId:
        paymentRequest.id,

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
