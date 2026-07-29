import {
  randomUUID,
} from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  PaymentDispatchResult,
} from '@forgeos/payment';

import {
  CapturePaymentDto,
  CreatePaymentDto,
  ListPaymentsQueryDto,
  RefundPaymentDto,
} from '../dto';

import {
  PaymentTransaction,
} from '../entities';

import {
  PaymentTransactionRepository,
} from '../repositories';

import {
  PaymentRuntimeService,
} from '../runtime/payment-runtime.service';

export interface CreatePropertyOSPaymentResult {
  duplicate:
    boolean;

  payment:
    PaymentTransaction;

  dispatchResult?:
    PaymentDispatchResult;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly runtime:
      PaymentRuntimeService,

    private readonly repository:
      PaymentTransactionRepository,
  ) {}

  async create(
    dto:
      CreatePaymentDto,

    context: {
      correlationId?:
        string;

      actorId?:
        string;
    } = {},
  ): Promise<
    CreatePropertyOSPaymentResult
  > {
    const existing =
      await this.repository
        .findByIdempotencyKey(
          dto.idempotencyKey,
        );

    if (existing) {
      this.assertIdempotentRequestMatches(
        existing,
        dto,
      );

      return {
        duplicate:
          true,

        payment:
          existing,
      };
    }

    const providerName =
      this.requireConfiguredProvider();

    const now =
      new Date();

    const payment:
      PaymentTransaction = {
        id:
          randomUUID(),

        source:
          dto.source,

        sourceReferenceId:
          dto.sourceReferenceId,

        providerName,

        idempotencyKey:
          dto.idempotencyKey,

        status:
          'CREATED',

        money: {
          amountMinor:
            dto.money.amountMinor,

          currency:
            dto.money.currency,
        },

        customerId:
          dto.customer?.id,

        description:
          dto.description,

        metadata: {
          ...dto.metadata,

          customer:
            dto.customer,

          receiptReference:
            dto.receiptReference,

          returnUrl:
            dto.returnUrl,

          createdBy:
            context.actorId,
        },

        createdAt:
          now,

        updatedAt:
          now,
      };

    await this.repository.create(
      payment,
    );

    const dispatchResult =
      await this.runtime
        .getPaymentDispatcher()
        .createPayment({
          paymentId:
            payment.id,

          providerName,

          correlationId:
            context.correlationId,

          metadata: {
            source:
              dto.source,

            sourceReferenceId:
              dto.sourceReferenceId,

            actorId:
              context.actorId,
          },

          request: {
            id:
              payment.id,

            idempotencyKey:
              dto.idempotencyKey,

            money:
              payment.money,

            description:
              dto.description,

            customer:
              dto.customer,

            receiptReference:
              dto.receiptReference,

            returnUrl:
              dto.returnUrl,

            source:
              dto.source,

            sourceReference:
              dto.sourceReferenceId,

            metadata:
              dto.metadata,
          },
        });

    const updated =
      await this.repository
        .findById(
          payment.id,
        );

    return {
      duplicate:
        false,

      payment:
        updated ??
        payment,

      dispatchResult,
    };
  }

  async findById(
    paymentId:
      string,
  ): Promise<
    PaymentTransaction
  > {
    const payment =
      await this.repository
        .findById(
          paymentId,
        );

    if (!payment) {
      throw new NotFoundException({
        code:
          'PAYMENT_NOT_FOUND',

        message:
          `Payment not found: ${paymentId}`,
      });
    }

    return payment;
  }

  async list(
    query:
      ListPaymentsQueryDto,
  ): Promise<
    PaymentTransaction[]
  > {
    return this.repository.list({
      providerName:
        query.providerName,

      status:
        query.status,

      source:
        query.source,

      sourceReferenceId:
        query.sourceReferenceId,

      customerId:
        query.customerId,
    });
  }

  async capture(
    paymentId:
      string,

    dto:
      CapturePaymentDto,

    context: {
      correlationId?:
        string;

      actorId?:
        string;
    } = {},
  ): Promise<
    PaymentDispatchResult
  > {
    const payment =
      await this.findById(
        paymentId,
      );

    this.assertConfiguredProviderMatches(
      payment,
    );

    if (
      payment.status ===
        'CAPTURED' ||
      payment.status ===
        'REFUNDED' ||
      payment.status ===
        'CANCELLED'
    ) {
      throw new ConflictException({
        code:
          'PAYMENT_CAPTURE_STATE_INVALID',

        message:
          `Payment cannot be captured from status ${payment.status}`,
      });
    }

    if (
      !payment.providerPaymentId
    ) {
      throw new BadRequestException({
        code:
          'PAYMENT_PROVIDER_PAYMENT_ID_REQUIRED',

        message:
          'Provider payment identifier is required before capture',
      });
    }

    return this.runtime
      .getPaymentDispatcher()
      .capturePayment({
        paymentId:
          payment.id,

        providerName:
          payment.providerName,

        correlationId:
          context.correlationId,

        metadata: {
          actorId:
            context.actorId,

          operationIdempotencyKey:
            dto.idempotencyKey,
        },

        request: {
          providerPaymentId:
            payment.providerPaymentId,

          idempotencyKey:
            dto.idempotencyKey,

          money:
            dto.money,

          metadata:
            dto.metadata,
        },
      });
  }

  async refund(
    paymentId:
      string,

    dto:
      RefundPaymentDto,

    context: {
      correlationId?:
        string;

      actorId?:
        string;
    } = {},
  ): Promise<
    PaymentDispatchResult
  > {
    const payment =
      await this.findById(
        paymentId,
      );

    this.assertConfiguredProviderMatches(
      payment,
    );

    if (
      payment.status !==
        'CAPTURED' &&
      payment.status !==
        'PARTIALLY_REFUNDED'
    ) {
      throw new ConflictException({
        code:
          'PAYMENT_REFUND_STATE_INVALID',

        message:
          `Payment cannot be refunded from status ${payment.status}`,
      });
    }

    if (
      !payment.providerPaymentId
    ) {
      throw new BadRequestException({
        code:
          'PAYMENT_PROVIDER_PAYMENT_ID_REQUIRED',

        message:
          'Provider payment identifier is required before refund',
      });
    }

    return this.runtime
      .getPaymentDispatcher()
      .refundPayment({
        paymentId:
          payment.id,

        providerName:
          payment.providerName,

        correlationId:
          context.correlationId,

        metadata: {
          actorId:
            context.actorId,

          operationIdempotencyKey:
            dto.idempotencyKey,
        },

        request: {
          providerPaymentId:
            payment.providerPaymentId,

          idempotencyKey:
            dto.idempotencyKey,

          money:
            dto.money,

          reason:
            dto.reason,

          metadata:
            dto.metadata,
        },
      });
  }

  private requireConfiguredProvider():
    string {
    const providerName =
      this.runtime
        .getConfiguredProvider();

    if (!providerName) {
      throw new ServiceUnavailableException({
        code:
          'PAYMENT_PROVIDER_DISABLED',

        message:
          'Payment provider is not enabled',
      });
    }

    return providerName;
  }

  private assertConfiguredProviderMatches(
    payment:
      PaymentTransaction,
  ): void {
    const configuredProvider =
      this.requireConfiguredProvider();

    if (
      configuredProvider !==
      payment.providerName
    ) {
      throw new ConflictException({
        code:
          'PAYMENT_PROVIDER_MISMATCH',

        message:
          `Payment belongs to ${payment.providerName}, but ${configuredProvider} is configured`,
      });
    }
  }

  private assertIdempotentRequestMatches(
    existing:
      PaymentTransaction,

    dto:
      CreatePaymentDto,
  ): void {
    const matches =
      existing.source ===
        dto.source &&
      existing.sourceReferenceId ===
        dto.sourceReferenceId &&
      existing.money.amountMinor ===
        dto.money.amountMinor &&
      existing.money.currency ===
        dto.money.currency;

    if (!matches) {
      throw new ConflictException({
        code:
          'PAYMENT_IDEMPOTENCY_CONFLICT',

        message:
          'Idempotency key is already associated with a different payment request',
      });
    }
  }
}
