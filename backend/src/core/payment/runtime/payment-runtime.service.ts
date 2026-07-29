import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PaymentDispatcher,
  PaymentProvider,
  PaymentProviderRegistry,
  PaymentWebhookDispatcher,
  PaymentWebhookHandlerRegistry,
} from '@forgeos/payment';

import {
  createPropertyOSRazorpayProvider,
  createPropertyOSStripeProvider,
  PropertyOSPaymentEventPublisherAdapter,
  PropertyOSPaymentLoggerAdapter,
} from '../adapters/forgeos';

import {
  currentPaymentEnvironmentClass,
  resolvePaymentProviderSelection,
} from '../provider-selection';

@Injectable()
export class PaymentRuntimeService
  implements OnModuleInit
{
  private readonly providers =
    new PaymentProviderRegistry();

  private readonly handlers =
    new PaymentWebhookHandlerRegistry();

  private paymentDispatcher?:
    PaymentDispatcher;

  private webhookDispatcher?:
    PaymentWebhookDispatcher;

  private configuredProvider?:
    string;

  constructor(
    private readonly eventPublisher:
      PropertyOSPaymentEventPublisherAdapter,

    private readonly logger:
      PropertyOSPaymentLoggerAdapter,
  ) {}

  onModuleInit(): void {
    const selection =
      resolvePaymentProviderSelection({
        environmentClass:
          currentPaymentEnvironmentClass(
            process.env.NODE_ENV,
          ),

        configuredProvider:
          process.env
            .PAYMENT_PROVIDER,
      });

    if (
      selection.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `PAYMENT_PROVIDER_SELECTION_BLOCKED: ${selection.errors.join('; ')}`,
      );
    }

    if (
      selection.provider ===
      'RAZORPAY'
    ) {
      this.registerProvider(
        createPropertyOSRazorpayProvider({
          keyId:
            process.env
              .RAZORPAY_KEY_ID,

          keySecret:
            process.env
              .RAZORPAY_KEY_SECRET,

          webhookSecret:
            process.env
              .RAZORPAY_WEBHOOK_SECRET,

          endpoint:
            process.env
              .RAZORPAY_API_ENDPOINT,

          timeoutMilliseconds:
            process.env
              .RAZORPAY_TIMEOUT_MS,
        }),
      );
    }

    if (
      selection.provider ===
      'STRIPE'
    ) {
      this.registerProvider(
        createPropertyOSStripeProvider({
          secretKey:
            process.env
              .STRIPE_SECRET_KEY,

          webhookSecret:
            process.env
              .STRIPE_WEBHOOK_SECRET,

          endpoint:
            process.env
              .STRIPE_API_ENDPOINT,

          timeoutMilliseconds:
            process.env
              .STRIPE_TIMEOUT_MS,

          webhookToleranceSeconds:
            process.env
              .STRIPE_WEBHOOK_TOLERANCE_SECONDS,

          automaticPaymentMethods:
            process.env
              .STRIPE_AUTOMATIC_PAYMENT_METHODS,

          manualCapture:
            process.env
              .STRIPE_MANUAL_CAPTURE,
        }),
      );
    }

    this.paymentDispatcher =
      new PaymentDispatcher({
        providers:
          this.providers,

        eventPublisher:
          this.eventPublisher,

        logger:
          this.logger,
      });

    this.webhookDispatcher =
      new PaymentWebhookDispatcher({
        providers:
          this.providers,

        handlers:
          this.handlers,

        eventPublisher:
          this.eventPublisher,

        logger:
          this.logger,
      });

    this.configuredProvider =
      selection.enabled
        ? selection.provider
            .toLowerCase()
        : undefined;

    this.logger.info?.(
      'PropertyOS payment runtime initialized',
      {
        enabled:
          selection.enabled,

        provider:
          selection.provider,

        environmentClass:
          selection
            .environmentClass,
      },
    );
  }

  getPaymentDispatcher():
    PaymentDispatcher {
    if (!this.paymentDispatcher) {
      throw new Error(
        'PAYMENT_RUNTIME_NOT_INITIALIZED',
      );
    }

    return this.paymentDispatcher;
  }

  getWebhookDispatcher():
    PaymentWebhookDispatcher {
    if (!this.webhookDispatcher) {
      throw new Error(
        'PAYMENT_RUNTIME_NOT_INITIALIZED',
      );
    }

    return this.webhookDispatcher;
  }

  getProviderRegistry():
    PaymentProviderRegistry {
    return this.providers;
  }

  getWebhookHandlerRegistry():
    PaymentWebhookHandlerRegistry {
    return this.handlers;
  }

  getConfiguredProvider():
    string | undefined {
    return this.configuredProvider;
  }

  isEnabled(): boolean {
    return (
      this.configuredProvider !==
      undefined
    );
  }

  private registerProvider(
    provider:
      PaymentProvider,
  ): void {
    const configuration =
      provider
        .validateConfiguration();

    if (
      typeof configuration !==
        'object' ||
      configuration === null ||
      !(
        'status'
        in configuration
      )
    ) {
      throw new Error(
        `PAYMENT_PROVIDER_CONFIGURATION_INVALID: ${provider.name}`,
      );
    }

    const result =
      configuration as {
        status:
          | 'READY'
          | 'BLOCKED';

        errors?:
          readonly string[];
      };

    if (
      result.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `${provider.name.toUpperCase()}_CONFIGURATION_BLOCKED: ${(result.errors ?? []).join('; ')}`,
      );
    }

    this.providers.register(
      provider,
    );
  }
}
