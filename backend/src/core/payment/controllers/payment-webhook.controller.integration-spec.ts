import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentRuntimeService,
} from '../runtime';

import {
  PaymentWebhookController,
} from './payment-webhook.controller';

function request(
  rawBody:
    Buffer | undefined =
      Buffer.from(
        '{"event":"payment.captured"}',
      ),
) {
  return {
    rawBody,

    requestId:
      'request-1',

    headers: {},
  };
}

function runtime(
  input: {
    configuredProvider?:
      string;

    dispatchResult?:
      Record<string, unknown>;
  } = {},
): {
  subject:
    PaymentRuntimeService;

  dispatch:
    jest.Mock;
} {
  const dispatch =
    jest.fn(
      async () =>
        input.dispatchResult ?? {
          accepted:
            true,

          duplicate:
            false,

          providerName:
            input
              .configuredProvider ??
            'razorpay',

          verified: {
            valid:
              true,

            providerName:
              input
                .configuredProvider ??
              'razorpay',

            eventId:
              'event-1',

            eventType:
              'payment.captured',
          },

          event: {
            eventId:
              'event-1',

            eventType:
              'payment.captured',
          },

          handledBy: [
            'propertyos-payment-runtime',
          ],
        },
    );

  return {
    subject: {
      getConfiguredProvider:
        () =>
          input
            .configuredProvider ??
          'razorpay',

      getWebhookDispatcher:
        () => ({
          dispatch,
        }),
    } as unknown as
      PaymentRuntimeService,

    dispatch,
  };
}

describe(
  'PaymentWebhookController',
  () => {
    it(
      'dispatches a Razorpay raw-body webhook',
      async () => {
        const fixture =
          runtime({
            configuredProvider:
              'razorpay',
          });

        const controller =
          new PaymentWebhookController(
            fixture.subject,
          );

        await expect(
          controller.receive(
            'razorpay',

            request() as never,

            {
              'x-razorpay-signature':
                'signature-1',
            },
          ),
        ).resolves.toEqual({
          received:
            true,

          duplicate:
            false,

          providerName:
            'razorpay',

          eventId:
            'event-1',

          eventType:
            'payment.captured',

          handledBy: [
            'propertyos-payment-runtime',
          ],
        });

        expect(
          fixture.dispatch,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            providerName:
              'razorpay',

            rawBody:
              expect.any(
                Buffer,
              ),

            signature:
              'signature-1',

            correlationId:
              'request-1',
          }),
        );
      },
    );

    it(
      'dispatches a Stripe webhook using Stripe signature',
      async () => {
        const fixture =
          runtime({
            configuredProvider:
              'stripe',

            dispatchResult: {
              accepted:
                true,

              duplicate:
                true,

              providerName:
                'stripe',

              verified: {
                valid:
                  true,

                providerName:
                  'stripe',

                eventId:
                  'evt-1',

                eventType:
                  'payment_intent.succeeded',
              },

              handledBy: [],
            },
          });

        const controller =
          new PaymentWebhookController(
            fixture.subject,
          );

        await expect(
          controller.receive(
            'stripe',

            request() as never,

            {
              'stripe-signature':
                't=1,v1=signature',
            },
          ),
        ).resolves.toMatchObject({
          received:
            true,

          duplicate:
            true,

          providerName:
            'stripe',

          eventId:
            'evt-1',
        });

        expect(
          fixture.dispatch,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            signature:
              't=1,v1=signature',
          }),
        );
      },
    );

    it(
      'rejects unsupported providers',
      async () => {
        const controller =
          new PaymentWebhookController(
            runtime().subject,
          );

        await expect(
          controller.receive(
            'unknown',

            request() as never,

            {},
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects an unconfigured provider',
      async () => {
        const controller =
          new PaymentWebhookController(
            runtime({
              configuredProvider:
                'razorpay',
            }).subject,
          );

        await expect(
          controller.receive(
            'stripe',

            request() as never,

            {},
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects requests without exact raw body',
      async () => {
        const fixture =
          runtime({
            configuredProvider:
              'razorpay',
          });

        const controller =
          new PaymentWebhookController(
            fixture.subject,
          );

        await expect(
          controller.receive(
            'razorpay',

            {
              ...request(),
              rawBody:
                undefined,
            } as never,

            {},
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          fixture.dispatch,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns bad request for failed signature verification',
      async () => {
        const fixture =
          runtime({
            configuredProvider:
              'razorpay',

            dispatchResult: {
              accepted:
                false,

              providerName:
                'razorpay',

              verified: {
                valid:
                  false,

                providerName:
                  'razorpay',
              },

              handledBy: [],

              errorCode:
                'INVALID_SIGNATURE',

              errorMessage:
                'Invalid signature',
            },
          });

        const controller =
          new PaymentWebhookController(
            fixture.subject,
          );

        await expect(
          controller.receive(
            'razorpay',

            request() as never,

            {},
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'returns service unavailable for verified processing failure',
      async () => {
        const fixture =
          runtime({
            configuredProvider:
              'stripe',

            dispatchResult: {
              accepted:
                false,

              providerName:
                'stripe',

              verified: {
                valid:
                  true,

                providerName:
                  'stripe',
              },

              handledBy: [],

              errorCode:
                'HANDLER_FAILED',

              errorMessage:
                'Handler failed',
            },
          });

        const controller =
          new PaymentWebhookController(
            fixture.subject,
          );

        await expect(
          controller.receive(
            'stripe',

            request() as never,

            {},
          ),
        ).rejects.toBeInstanceOf(
          ServiceUnavailableException,
        );
      },
    );
  },
);
