import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  Public,
} from '../../auth/decorators/public.decorator';

import {
  PaymentWebhookAcknowledgementDto,
} from '../dto';

import {
  PaymentWebhookHttpRequest,
} from '../http';

import {
  PaymentRuntimeService,
} from '../runtime';

const SUPPORTED_PAYMENT_WEBHOOK_PROVIDERS =
  new Set([
    'razorpay',
    'stripe',
  ]);

function normalizeHeaderValue(
  value:
    string |
    string[] |
    undefined,
): string | undefined {
  if (
    Array.isArray(value)
  ) {
    return value[0];
  }

  return value;
}

function normalizeHeaders(
  headers:
    PaymentWebhookHttpRequest[
      'headers'
    ],
): Record<
  string,
  string | undefined
> {
  return Object.fromEntries(
    Object.entries(headers)
      .map(
        ([key, value]) => [
          key,
          normalizeHeaderValue(
            value,
          ),
        ],
      ),
  );
}

@Public()
@Controller(
  'payments/webhooks',
)
export class PaymentWebhookController {
  constructor(
    private readonly runtime:
      PaymentRuntimeService,
  ) {}

  @Post(
    ':providerName',
  )
  @HttpCode(
    HttpStatus.OK,
  )
  async receive(
    @Param('providerName')
    providerName:
      string,

    @Req()
    request:
      PaymentWebhookHttpRequest,

    @Headers()
    headers:
      PaymentWebhookHttpRequest[
        'headers'
      ],
  ): Promise<
    PaymentWebhookAcknowledgementDto
  > {
    const normalizedProvider =
      providerName
        .trim()
        .toLowerCase();

    if (
      !SUPPORTED_PAYMENT_WEBHOOK_PROVIDERS
        .has(
          normalizedProvider,
        )
    ) {
      throw new BadRequestException({
        code:
          'PAYMENT_WEBHOOK_PROVIDER_UNSUPPORTED',

        message:
          `Unsupported payment webhook provider: ${normalizedProvider}`,
      });
    }

    const configuredProvider =
      this.runtime
        .getConfiguredProvider();

    if (
      !configuredProvider ||
      configuredProvider !==
        normalizedProvider
    ) {
      throw new BadRequestException({
        code:
          'PAYMENT_WEBHOOK_PROVIDER_NOT_CONFIGURED',

        message:
          `Payment provider is not configured: ${normalizedProvider}`,
      });
    }

    if (!request.rawBody) {
      throw new BadRequestException({
        code:
          'PAYMENT_WEBHOOK_RAW_BODY_REQUIRED',

        message:
          'Exact raw request body is required for payment webhook verification',
      });
    }

    const normalizedHeaders =
      normalizeHeaders(
        headers,
      );

    const result =
      await this.runtime
        .getWebhookDispatcher()
        .dispatch({
          providerName:
            normalizedProvider,

          rawBody:
            request.rawBody,

          signature:
            normalizedProvider ===
              'razorpay'
              ? normalizedHeaders[
                  'x-razorpay-signature'
                ]
              : normalizedHeaders[
                  'stripe-signature'
                ],

          headers:
            normalizedHeaders,

          correlationId:
            request.requestId,

          metadata: {
            transport:
              'http',

            requestId:
              request.requestId,
          },
        });

    if (!result.accepted) {
      const response = {
        code:
          result.errorCode ??
          'PAYMENT_WEBHOOK_REJECTED',

        message:
          result.errorMessage ??
          'Payment webhook was rejected',
      };

      if (
        result.verified.valid
      ) {
        throw new ServiceUnavailableException(
          response,
        );
      }

      throw new BadRequestException(
        response,
      );
    }

    return {
      received:
        true,

      duplicate:
        result.duplicate ??
        false,

      providerName:
        result.providerName,

      eventId:
        result.event
          ?.eventId ??
        result.verified
          .eventId,

      eventType:
        result.event
          ?.eventType ??
        result.verified
          .eventType,

      handledBy:
        result.handledBy,
    };
  }
}
