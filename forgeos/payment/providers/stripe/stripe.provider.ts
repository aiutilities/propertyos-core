import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

import {
  CapturePaymentRequest,
  CreatePaymentRequest,
  PaymentProvider,
  PaymentProviderResult,
  RefundPaymentRequest,
  VerifiedPaymentWebhook,
  VerifyPaymentWebhookRequest,
} from '../../contracts';

import {
  resolveStripeConfiguration,
} from './stripe.configuration';

import {
  classifyStripeFailure,
} from './stripe.errors';

import {
  createStripeForm,
} from './stripe-form';

import {
  StripeConfiguration,
  StripeConfigurationResult,
  StripeErrorResponse,
  StripePaymentIntentResponse,
  StripeRefundResponse,
  StripeWebhookEnvelope,
} from './stripe.types';

function failedResult(
  errorCode: string,
  errorMessage: string,
  retryable: boolean,
  metadata:
    Record<string, unknown> = {},
): PaymentProviderResult {
  return {
    success: false,
    providerName:
      'stripe',
    status:
      'FAILED',
    errorCode,
    errorMessage,
    retryable,
    metadata,
  };
}

function sanitizeMetadata(
  metadata:
    Record<string, unknown> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(
      metadata ?? {},
    )
      .slice(0, 50)
      .map(
        ([key, value]) => [
          key.slice(0, 40),
          String(value).slice(
            0,
            500,
          ),
        ],
      ),
  );
}

function mapStripeStatus(
  status: string,
):
  | 'CREATED'
  | 'REQUIRES_ACTION'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED' {
  if (status === 'succeeded') {
    return 'CAPTURED';
  }

  if (
    status ===
    'requires_capture'
  ) {
    return 'AUTHORIZED';
  }

  if (
    status ===
      'requires_action' ||
    status ===
      'requires_confirmation'
  ) {
    return 'REQUIRES_ACTION';
  }

  if (status === 'canceled') {
    return 'CANCELLED';
  }

  if (
    status ===
    'requires_payment_method'
  ) {
    return 'FAILED';
  }

  return 'CREATED';
}

function parseStripeSignature(
  header: string,
): {
  timestamp?: number;
  signatures: string[];
} {
  const result = {
    timestamp:
      undefined as
        number | undefined,
    signatures:
      [] as string[],
  };

  header
    .split(',')
    .map(
      (item) =>
        item.trim(),
    )
    .forEach(
      (item) => {
        const separator =
          item.indexOf('=');

        if (separator < 1) {
          return;
        }

        const key =
          item.slice(
            0,
            separator,
          );

        const value =
          item.slice(
            separator + 1,
          );

        if (key === 't') {
          const timestamp =
            Number(value);

          if (
            Number.isSafeInteger(
              timestamp,
            )
          ) {
            result.timestamp =
              timestamp;
          }
        }

        if (
          key === 'v1' &&
          /^[a-f0-9]{64}$/i.test(
            value,
          )
        ) {
          result.signatures.push(
            value.toLowerCase(),
          );
        }
      },
    );

  return result;
}

export class StripeProvider
  implements PaymentProvider
{
  readonly name =
    'stripe';

  constructor(
    private readonly configuration:
      StripeConfiguration,
  ) {}

  validateConfiguration():
    StripeConfigurationResult {
    return resolveStripeConfiguration(
      this.configuration,
    );
  }

  async createPayment(
    request:
      CreatePaymentRequest,
  ): Promise<PaymentProviderResult> {
    const configuration =
      this.validateConfiguration();

    const metadata =
      sanitizeMetadata({
        ...request.metadata,
        source:
          request.source,
        sourceReference:
          request.sourceReference ??
          '',
        receiptReference:
          request.receiptReference ??
          '',
      });

    return this.request<
      StripePaymentIntentResponse
    >({
      path:
        '/payment_intents',

      idempotencyKey:
        request.idempotencyKey,

      body: {
        amount:
          request.money.amountMinor,

        currency:
          request.money.currency
            .toLowerCase(),

        description:
          request.description,

        receipt_email:
          request.customer
            ?.email,

        metadata,

        automatic_payment_methods:
          configuration
            .automaticPaymentMethods
            ? {
                enabled:
                  true,
              }
            : undefined,

        capture_method:
          configuration
            .manualCapture
            ? 'manual'
            : 'automatic',
      },

      mapSuccess:
        (response) => {
          const status =
            mapStripeStatus(
              response.status,
            );

          return {
            success:
              status !==
              'FAILED',

            providerName:
              this.name,

            providerOrderId:
              response.id,

            providerPaymentId:
              response.id,

            status,

            money: {
              amountMinor:
                response.amount,

              currency:
                response.currency
                  .toUpperCase(),
            },

            clientSecret:
              response.client_secret ??
              undefined,

            createdAt:
              response.created
                ? new Date(
                    response.created *
                      1000,
                  ).toISOString()
                : new Date()
                    .toISOString(),

            retryable:
              false,

            metadata: {
              stripeStatus:
                response.status,

              latestCharge:
                response.latest_charge,
            },
          };
        },
    });
  }

  async capturePayment(
    request:
      CapturePaymentRequest,
  ): Promise<PaymentProviderResult> {
    const body:
      Record<string, unknown> = {};

    if (request.money) {
      body.amount_to_capture =
        request.money.amountMinor;
    }

    return this.request<
      StripePaymentIntentResponse
    >({
      path:
        `/payment_intents/${encodeURIComponent(
          request.providerPaymentId,
        )}/capture`,

      idempotencyKey:
        request.idempotencyKey,

      body,

      mapSuccess:
        (response) => ({
          success:
            response.status ===
            'succeeded',

          providerName:
            this.name,

          providerOrderId:
            response.id,

          providerPaymentId:
            response.id,

          status:
            mapStripeStatus(
              response.status,
            ),

          money: {
            amountMinor:
              response.amount_received ||
              response.amount,

            currency:
              response.currency
                .toUpperCase(),
          },

          completedAt:
            response.status ===
              'succeeded'
              ? new Date()
                  .toISOString()
              : undefined,

          retryable:
            false,

          metadata: {
            stripeStatus:
              response.status,
          },
        }),
    });
  }

  async refundPayment(
    request:
      RefundPaymentRequest,
  ): Promise<PaymentProviderResult> {
    return this.request<
      StripeRefundResponse
    >({
      path:
        '/refunds',

      idempotencyKey:
        request.idempotencyKey,

      body: {
        payment_intent:
          request.providerPaymentId,

        amount:
          request.money
            ?.amountMinor,

        reason:
          request.reason ===
            'duplicate' ||
          request.reason ===
            'fraudulent' ||
          request.reason ===
            'requested_by_customer'
            ? request.reason
            : undefined,

        metadata:
          sanitizeMetadata({
            ...request.metadata,

            internalReason:
              request.reason ??
              '',
          }),
      },

      mapSuccess:
        (response) => {
          const succeeded =
            response.status ===
              undefined ||
            response.status ===
              null ||
            response.status ===
              'succeeded';

          return {
            success:
              succeeded,

            providerName:
              this.name,

            providerPaymentId:
              response
                .payment_intent ??
              undefined,

            providerRefundId:
              response.id,

            status:
              succeeded
                ? 'REFUNDED'
                : 'FAILED',

            money: {
              amountMinor:
                response.amount,

              currency:
                response.currency
                  .toUpperCase(),
            },

            completedAt:
              succeeded
                ? new Date()
                    .toISOString()
                : undefined,

            retryable:
              false,

            metadata: {
              refundStatus:
                response.status,

              chargeId:
                response.charge,
            },
          };
        },
    });
  }

  async verifyWebhook(
    request:
      VerifyPaymentWebhookRequest,
  ): Promise<VerifiedPaymentWebhook> {
    const configuration =
      this.validateConfiguration();

    if (
      configuration.status ===
      'BLOCKED'
    ) {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'CONFIGURATION_BLOCKED',

        errorMessage:
          configuration.errors.join(
            '; ',
          ),
      };
    }

    const signatureHeader =
      request.signature ??
      request.headers[
        'stripe-signature'
      ] ??
      request.headers[
        'Stripe-Signature'
      ];

    if (!signatureHeader) {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'SIGNATURE_REQUIRED',

        errorMessage:
          'Stripe webhook signature is required',
      };
    }

    const parsedSignature =
      parseStripeSignature(
        signatureHeader,
      );

    if (
      parsedSignature.timestamp ===
        undefined ||
      parsedSignature.signatures
        .length === 0
    ) {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'INVALID_SIGNATURE_FORMAT',

        errorMessage:
          'Stripe webhook signature format is invalid',
      };
    }

    const currentTimestamp =
      Math.floor(
        Date.now() /
        1000,
      );

    if (
      configuration
        .webhookToleranceSeconds >
        0 &&
      Math.abs(
        currentTimestamp -
        parsedSignature.timestamp,
      ) >
        configuration
          .webhookToleranceSeconds
    ) {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'SIGNATURE_EXPIRED',

        errorMessage:
          'Stripe webhook signature timestamp is outside the allowed tolerance',
      };
    }

    const rawBody =
      typeof request.rawBody ===
        'string'
        ? Buffer.from(
            request.rawBody,
            'utf8',
          )
        : Buffer.from(
            request.rawBody,
          );

    const signedPayload =
      `${parsedSignature.timestamp}.${rawBody.toString('utf8')}`;

    const expected =
      createHmac(
        'sha256',
        configuration
          .webhookSecret!,
      )
        .update(
          signedPayload,
          'utf8',
        )
        .digest(
          'hex',
        )
        .toLowerCase();

    const valid =
      parsedSignature.signatures
        .some(
          (signature) =>
            signature.length ===
              expected.length &&
            timingSafeEqual(
              Buffer.from(
                signature,
                'utf8',
              ),
              Buffer.from(
                expected,
                'utf8',
              ),
            ),
        );

    if (!valid) {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'INVALID_SIGNATURE',

        errorMessage:
          'Stripe webhook signature is invalid',
      };
    }

    let payload:
      StripeWebhookEnvelope;

    try {
      payload =
        JSON.parse(
          rawBody.toString(
            'utf8',
          ),
        ) as
          StripeWebhookEnvelope;
    } catch {
      return {
        valid: false,

        providerName:
          this.name,

        errorCode:
          'INVALID_PAYLOAD',

        errorMessage:
          'Stripe webhook body is invalid JSON',
      };
    }

    const object =
      payload.data
        ?.object ?? {};

    const providerPaymentId =
      typeof object.id ===
        'string'
        ? object.id
        : undefined;

    return {
      valid: true,

      providerName:
        this.name,

      eventId:
        payload.id,

      eventType:
        payload.type,

      providerOrderId:
        providerPaymentId,

      providerPaymentId,

      status:
        typeof object.status ===
          'string'
          ? mapStripeStatus(
              object.status,
            )
          : undefined,

      money:
        typeof object.amount ===
          'number' &&
        typeof object.currency ===
          'string'
          ? {
              amountMinor:
                object.amount,

              currency:
                object.currency
                  .toUpperCase(),
            }
          : undefined,

      occurredAt:
        payload.created
          ? new Date(
              payload.created *
                1000,
            ).toISOString()
          : undefined,

      metadata: {
        livemode:
          object.livemode,
      },
    };
  }

  private async request<T>(
    input: {
      path: string;

      idempotencyKey:
        string;

      body:
        Record<string, unknown>;

      mapSuccess:
        (
          response: T,
        ) =>
          PaymentProviderResult;
    },
  ): Promise<PaymentProviderResult> {
    const configuration =
      this.validateConfiguration();

    if (
      configuration.status ===
      'BLOCKED'
    ) {
      return failedResult(
        'CONFIGURATION_BLOCKED',

        `STRIPE_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,

        false,
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        configuration
          .timeoutMilliseconds,
      );

    try {
      const response =
        await fetch(
          `${configuration.endpoint}${input.path}`,
          {
            method: 'POST',

            redirect:
              'error',

            headers: {
              accept:
                'application/json',

              authorization:
                `Bearer ${configuration.secretKey!}`,

              'content-type':
                'application/x-www-form-urlencoded',

              'idempotency-key':
                input.idempotencyKey
                  .slice(
                    0,
                    255,
                  ),
            },

            body:
              createStripeForm(
                input.body,
              ).toString(),

            signal:
              controller.signal,
          },
        );

      const safeMetadata = {
        httpStatus:
          response.status,

        requestId:
          response.headers
            .get(
              'request-id',
            ) ??
          response.headers
            .get(
              'stripe-request-id',
            ),

        endpointHost:
          new URL(
            configuration.endpoint,
          ).host,
      };

      let responseBody:
        unknown;

      try {
        responseBody =
          await response.json();
      } catch {
        return failedResult(
          response.ok
            ? 'INVALID_ACKNOWLEDGEMENT'
            : 'PROVIDER_REJECTED',

          `Stripe returned HTTP ${response.status} with invalid JSON`,

          response.status >=
            500,

          safeMetadata,
        );
      }

      if (!response.ok) {
        const providerError =
          (
            responseBody as
              StripeErrorResponse
          ).error;

        const classification =
          classifyStripeFailure(
            response.status,
            providerError?.type,
            providerError?.code,
          );

        return failedResult(
          classification.errorCode,

          providerError
            ?.message ??
            `Stripe returned HTTP ${response.status}`,

          classification.retryable,

          {
            ...safeMetadata,

            providerErrorType:
              providerError?.type,

            providerErrorCode:
              providerError?.code,

            declineCode:
              providerError
                ?.decline_code,

            requestLogUrl:
              providerError
                ?.request_log_url,
          },
        );
      }

      return input.mapSuccess(
        responseBody as T,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        return failedResult(
          'PROVIDER_TIMEOUT',
          'Stripe request timed out',
          true,
        );
      }

      return failedResult(
        'PROVIDER_UNAVAILABLE',
        'Stripe request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
