import {
  PaymentProviderResult,
  validatePaymentMoney,
} from '../contracts';

import {
  NoopPaymentEventPublisher,
  PaymentEventPublisher,
} from '../ports/payment-event-publisher';

import {
  NoopPaymentLogger,
  PaymentLogger,
} from '../ports/payment-logger';

import {
  NoopPaymentStateStore,
  PaymentStateStore,
} from '../ports/payment-state-store';

import {
  PaymentProviderRegistry,
} from '../registry';

import {
  PaymentOperationNotSupportedError,
} from './payment-dispatcher.error';

import {
  DispatchCapturePaymentInput,
  DispatchCreatePaymentInput,
  DispatchRefundPaymentInput,
  PaymentDispatchResult,
} from './payment-dispatcher.types';

export interface PaymentDispatcherDependencies {
  providers:
    PaymentProviderRegistry;

  stateStore?:
    PaymentStateStore;

  eventPublisher?:
    PaymentEventPublisher;

  logger?:
    PaymentLogger;
}

export class PaymentDispatcher {
  private readonly stateStore:
    PaymentStateStore;

  private readonly eventPublisher:
    PaymentEventPublisher;

  private readonly logger:
    PaymentLogger;

  constructor(
    private readonly dependencies:
      PaymentDispatcherDependencies,
  ) {
    this.stateStore =
      dependencies.stateStore ??
      new NoopPaymentStateStore();

    this.eventPublisher =
      dependencies.eventPublisher ??
      new NoopPaymentEventPublisher();

    this.logger =
      dependencies.logger ??
      new NoopPaymentLogger();
  }

  async createPayment(
    input:
      DispatchCreatePaymentInput,
  ): Promise<PaymentDispatchResult> {
    const moneyErrors =
      validatePaymentMoney(
        input.request.money,
      );

    if (
      moneyErrors.length > 0
    ) {
      return this.failValidation(
        input.paymentId,
        input.providerName,
        moneyErrors,
        input,
      );
    }

    const provider =
      this.dependencies.providers.require(
        input.providerName,
      );

    return this.execute(
      input.paymentId,
      input.providerName,
      'create',
      () =>
        provider.createPayment(
          input.request,
        ),
      input,
    );
  }

  async capturePayment(
    input:
      DispatchCapturePaymentInput,
  ): Promise<PaymentDispatchResult> {
    if (input.request.money) {
      const moneyErrors =
        validatePaymentMoney(
          input.request.money,
        );

      if (
        moneyErrors.length > 0
      ) {
        return this.failValidation(
          input.paymentId,
          input.providerName,
          moneyErrors,
          input,
        );
      }
    }

    const provider =
      this.dependencies.providers.require(
        input.providerName,
      );

    if (!provider.capturePayment) {
      throw new PaymentOperationNotSupportedError(
        provider.name,
        'capturePayment',
      );
    }

    return this.execute(
      input.paymentId,
      input.providerName,
      'capture',
      () =>
        provider.capturePayment!(
          input.request,
        ),
      input,
    );
  }

  async refundPayment(
    input:
      DispatchRefundPaymentInput,
  ): Promise<PaymentDispatchResult> {
    if (input.request.money) {
      const moneyErrors =
        validatePaymentMoney(
          input.request.money,
        );

      if (
        moneyErrors.length > 0
      ) {
        return this.failValidation(
          input.paymentId,
          input.providerName,
          moneyErrors,
          input,
        );
      }
    }

    const provider =
      this.dependencies.providers.require(
        input.providerName,
      );

    return this.execute(
      input.paymentId,
      input.providerName,
      'refund',
      () =>
        provider.refundPayment(
          input.request,
        ),
      input,
    );
  }

  private async execute(
    paymentId: string,
    providerName: string,
    operation:
      | 'create'
      | 'capture'
      | 'refund',
    executor:
      () => Promise<PaymentProviderResult>,
    context: {
      correlationId?: string;
      causationId?: string;
      metadata?:
        Record<string, unknown>;
    },
  ): Promise<PaymentDispatchResult> {
    await this.eventPublisher.publish({
      type:
        `payment.${operation}.started`,

      source:
        'forgeos.payment.dispatcher',

      payload: {
        paymentId,
        providerName,
      },

      correlationId:
        context.correlationId,

      causationId:
        context.causationId,

      metadata:
        context.metadata,
    });

    try {
      const result =
        await executor();

      await this.stateStore
        .updatePaymentState({
          paymentId,

          status:
            result.status,

          providerName:
            result.providerName,

          providerOrderId:
            result.providerOrderId,

          providerPaymentId:
            result.providerPaymentId,

          providerRefundId:
            result.providerRefundId,

          money:
            result.money,

          metadata: {
            ...context.metadata,

            providerMetadata:
              result.metadata ?? {},

            errorCode:
              result.errorCode,

            errorMessage:
              result.errorMessage,
          },
        });

      await this.eventPublisher.publish({
        type:
          result.success
            ? `payment.${operation}.completed`
            : `payment.${operation}.failed`,

        source:
          'forgeos.payment.dispatcher',

        payload: {
          paymentId,

          providerName:
            result.providerName,

          status:
            result.status,

          providerOrderId:
            result.providerOrderId,

          providerPaymentId:
            result.providerPaymentId,

          providerRefundId:
            result.providerRefundId,

          errorCode:
            result.errorCode,
        },

        correlationId:
          context.correlationId,

        causationId:
          context.causationId,

        metadata:
          context.metadata,
      });

      return {
        paymentId,
        ...result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown payment provider error';

      this.logger.error(
        'Payment provider execution failed',
        {
          paymentId,
          providerName,
          operation,
          error:
            errorMessage,
        },
      );

      const result:
        PaymentDispatchResult = {
          paymentId,

          success: false,

          providerName,

          status:
            'FAILED',

          errorCode:
            'PROVIDER_EXCEPTION',

          errorMessage,

          retryable: true,
        };

      await this.stateStore
        .updatePaymentState({
          paymentId,

          status:
            'FAILED',

          providerName,

          metadata: {
            ...context.metadata,

            errorCode:
              result.errorCode,

            errorMessage,
          },
        });

      await this.eventPublisher.publish({
        type:
          `payment.${operation}.failed`,

        source:
          'forgeos.payment.dispatcher',

        payload: {
          paymentId,
          providerName,

          status:
            'FAILED',

          errorCode:
            result.errorCode,
        },

        correlationId:
          context.correlationId,

        causationId:
          context.causationId,

        metadata:
          context.metadata,
      });

      return result;
    }
  }

  private async failValidation(
    paymentId: string,
    providerName: string,
    errors:
      readonly string[],
    context: {
      correlationId?: string;
      causationId?: string;
      metadata?:
        Record<string, unknown>;
    },
  ): Promise<PaymentDispatchResult> {
    const errorMessage =
      errors.join('; ');

    await this.stateStore
      .updatePaymentState({
        paymentId,

        status:
          'FAILED',

        providerName,

        metadata: {
          ...context.metadata,

          errorCode:
            'VALIDATION_FAILED',

          errorMessage,
        },
      });

    await this.eventPublisher.publish({
      type:
        'payment.validation.failed',

      source:
        'forgeos.payment.dispatcher',

      payload: {
        paymentId,
        providerName,
        errors,
      },

      correlationId:
        context.correlationId,

      causationId:
        context.causationId,

      metadata:
        context.metadata,
    });

    return {
      paymentId,

      success: false,

      providerName,

      status:
        'FAILED',

      errorCode:
        'VALIDATION_FAILED',

      errorMessage,

      retryable: false,
    };
  }
}
