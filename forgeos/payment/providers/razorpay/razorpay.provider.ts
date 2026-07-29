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
  resolveRazorpayConfiguration,
} from './razorpay.configuration';

import {
  classifyRazorpayFailure,
} from './razorpay.errors';

import {
  RazorpayConfiguration,
  RazorpayConfigurationResult,
  RazorpayErrorResponse,
  RazorpayOrderResponse,
  RazorpayPaymentResponse,
  RazorpayRefundResponse,
} from './razorpay.types';

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
      'razorpay',
    status:
      'FAILED',
    errorCode,
    errorMessage,
    retryable,
    metadata,
  };
}

function sanitizeNotes(
  metadata:
    Record<string, unknown> | undefined,
): Record<string, string> {
  const entries =
    Object.entries(
      metadata ?? {},
    )
      .slice(0, 15)
      .map(
        ([key, value]) => [
          key.slice(0, 255),
          String(value).slice(
            0,
            256,
          ),
        ],
      );

  return Object.fromEntries(
    entries,
  );
}

function mapPaymentStatus(
  status: string,
):
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED' {
  if (status === 'captured') {
    return 'CAPTURED';
  }

  if (status === 'authorized') {
    return 'AUTHORIZED';
  }

  if (
    status === 'failed'
  ) {
    return 'FAILED';
  }

  return 'CREATED';
}

export class RazorpayProvider
  implements PaymentProvider
{
  readonly name =
    'razorpay';

  constructor(
    private readonly configuration:
      RazorpayConfiguration,
  ) {}

  validateConfiguration():
    RazorpayConfigurationResult {
    return resolveRazorpayConfiguration(
      this.configuration,
    );
  }

  async createPayment(
    request:
      CreatePaymentRequest,
  ): Promise<PaymentProviderResult> {
    const receipt =
      (
        request.receiptReference ??
        request.idempotencyKey
      )
        .trim()
        .slice(0, 40);

    return this.request<
      RazorpayOrderResponse
    >({
      path:
        '/orders',

      body: {
        amount:
          request.money.amountMinor,

        currency:
          request.money.currency,

        receipt,

        notes:
          sanitizeNotes({
            ...request.metadata,

            source:
              request.source,

            sourceReference:
              request.sourceReference ??
              '',
          }),
      },

      mapSuccess:
        (response) => ({
          success: true,

          providerName:
            this.name,

          providerOrderId:
            response.id,

          status:
            'CREATED',

          money: {
            amountMinor:
              response.amount,

            currency:
              response.currency,
          },

          createdAt:
            response.created_at
              ? new Date(
                  response.created_at *
                    1000,
                ).toISOString()
              : new Date()
                  .toISOString(),

          metadata: {
            orderStatus:
              response.status,

            receipt:
              response.receipt,
          },
        }),
    });
  }

  async capturePayment(
    request:
      CapturePaymentRequest,
  ): Promise<PaymentProviderResult> {
    if (!request.money) {
      return failedResult(
        'CAPTURE_AMOUNT_REQUIRED',
        'Razorpay capture requires amount and currency',
        false,
      );
    }

    return this.request<
      RazorpayPaymentResponse
    >({
      path:
        `/payments/${encodeURIComponent(
          request.providerPaymentId,
        )}/capture`,

      body: {
        amount:
          request.money.amountMinor,

        currency:
          request.money.currency,
      },

      mapSuccess:
        (response) => ({
          success:
            response.status ===
              'captured' ||
            response.captured ===
              true,

          providerName:
            this.name,

          providerOrderId:
            response.order_id ??
            undefined,

          providerPaymentId:
            response.id,

          status:
            mapPaymentStatus(
              response.status,
            ),

          money: {
            amountMinor:
              response.amount,

            currency:
              response.currency,
          },

          completedAt:
            response.status ===
              'captured'
              ? new Date()
                  .toISOString()
              : undefined,

          retryable:
            false,

          metadata: {
            captured:
              response.captured,
          },
        }),
    });
  }

  async refundPayment(
    request:
      RefundPaymentRequest,
  ): Promise<PaymentProviderResult> {
    const body:
      Record<string, unknown> = {
        receipt:
          request.idempotencyKey
            .slice(0, 40),

        notes:
          sanitizeNotes({
            ...request.metadata,

            reason:
              request.reason ??
              '',
          }),
      };

    if (request.money) {
      body.amount =
        request.money.amountMinor;
    }

    return this.request<
      RazorpayRefundResponse
    >({
      path:
        `/payments/${encodeURIComponent(
          request.providerPaymentId,
        )}/refund`,

      headers: {
        'x-refund-idempotency':
          request.idempotencyKey,
      },

      body,

      mapSuccess:
        (response) => ({
          success: true,

          providerName:
            this.name,

          providerPaymentId:
            response.payment_id,

          providerRefundId:
            response.id,

          status:
            'REFUNDED',

          money: {
            amountMinor:
              response.amount,

            currency:
              response.currency,
          },

          completedAt:
            new Date()
              .toISOString(),

          metadata: {
            refundStatus:
              response.status,
          },
        }),
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

    const signature =
      request.signature ??
      request.headers[
        'x-razorpay-signature'
      ] ??
      request.headers[
        'X-Razorpay-Signature'
      ];

    if (!signature) {
      return {
        valid: false,
        providerName:
          this.name,
        errorCode:
          'SIGNATURE_REQUIRED',
        errorMessage:
          'Razorpay webhook signature is required',
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

    const expected =
      createHmac(
        'sha256',
        configuration
          .webhookSecret!,
      )
        .update(rawBody)
        .digest('hex');

    const supplied =
      signature.trim();

    const valid =
      supplied.length ===
        expected.length &&
      timingSafeEqual(
        Buffer.from(
          supplied,
          'utf8',
        ),
        Buffer.from(
          expected,
          'utf8',
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
          'Razorpay webhook signature is invalid',
      };
    }

    let payload:
      Record<string, unknown>;

    try {
      payload =
        JSON.parse(
          rawBody.toString(
            'utf8',
          ),
        ) as
          Record<string, unknown>;
    } catch {
      return {
        valid: false,
        providerName:
          this.name,
        errorCode:
          'INVALID_PAYLOAD',
        errorMessage:
          'Razorpay webhook body is invalid JSON',
      };
    }

    return {
      valid: true,

      providerName:
        this.name,

      eventId:
        typeof payload.id ===
          'string'
          ? payload.id
          : undefined,

      eventType:
        typeof payload.event ===
          'string'
          ? payload.event
          : undefined,

      occurredAt:
        typeof payload.created_at ===
          'number'
          ? new Date(
              payload.created_at *
                1000,
            ).toISOString()
          : undefined,

      metadata: {
        accountId:
          payload.account_id,
      },
    };
  }

  private async request<T>(
    input: {
      path: string;

      body:
        Record<string, unknown>;

      headers?:
        Record<string, string>;

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
        `RAZORPAY_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
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
      const basicToken =
        Buffer.from(
          `${configuration.keyId}:${configuration.keySecret}`,
          'utf8',
        ).toString(
          'base64',
        );

      const response =
        await fetch(
          `${configuration.endpoint}${input.path}`,
          {
            method: 'POST',
            redirect: 'error',

            headers: {
              accept:
                'application/json',

              authorization:
                `Basic ${basicToken}`,

              'content-type':
                'application/json',

              ...input.headers,
            },

            body:
              JSON.stringify(
                input.body,
              ),

            signal:
              controller.signal,
          },
        );

      const safeMetadata = {
        httpStatus:
          response.status,

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

          `Razorpay returned HTTP ${response.status} with invalid JSON`,

          response.status >=
            500,

          safeMetadata,
        );
      }

      if (!response.ok) {
        const providerError =
          (
            responseBody as
              RazorpayErrorResponse
          ).error;

        const classification =
          classifyRazorpayFailure(
            response.status,
            providerError?.code,
          );

        return failedResult(
          classification.errorCode,

          providerError
            ?.description ??
            `Razorpay returned HTTP ${response.status}`,

          classification.retryable,

          {
            ...safeMetadata,

            providerErrorCode:
              providerError?.code,

            providerErrorReason:
              providerError?.reason,
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
          'Razorpay request timed out',
          true,
        );
      }

      return failedResult(
        'PROVIDER_UNAVAILABLE',
        'Razorpay request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
