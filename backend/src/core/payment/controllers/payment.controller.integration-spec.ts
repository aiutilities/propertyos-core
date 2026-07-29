import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentService,
} from '../services';

import {
  PaymentController,
} from './payment.controller';

describe(
  'PaymentController',
  () => {
    it(
      'creates a payment using the application service',
      async () => {
        const create =
          jest.fn(
            async (
              _dto:
                Record<string, unknown>,

              _context:
                Record<string, unknown>,
            ) => ({
              duplicate:
                false,

              payment: {
                id:
                  'payment-1',
              },
            }),
          );

        const controller =
          new PaymentController({
            create,
          } as unknown as
            PaymentService);

        await expect(
          controller.create(
            {
              idempotencyKey:
                'payment-1',

              source:
                'propertyos.invoice',

              money: {
                amountMinor:
                  125000,

                currency:
                  'INR',
              },
            },

            'request-1',
            'actor-1',
          ),
        ).resolves.toEqual({
          success:
            true,

          data: {
            duplicate:
              false,

            payment: {
              id:
                'payment-1',
            },
          },
        });

        expect(create)
          .toHaveBeenCalledWith(
            expect.any(
              Object,
            ),

            {
              correlationId:
                'request-1',

              actorId:
                'actor-1',
            },
          );
      },
    );

    it(
      'returns payment list results',
      async () => {
        const controller =
          new PaymentController({
            list:
              jest.fn(
                async () => [
                  {
                    id:
                      'payment-1',
                  },
                ],
              ),
          } as unknown as
            PaymentService);

        await expect(
          controller.list({}),
        ).resolves.toEqual({
          success:
            true,

          data: [
            {
              id:
                'payment-1',
            },
          ],
        });
      },
    );

    it(
      'delegates capture and refund operations',
      async () => {
        const capture =
          jest.fn(
            async () => ({
              status:
                'CAPTURED',
            }),
          );

        const refund =
          jest.fn(
            async () => ({
              status:
                'REFUNDED',
            }),
          );

        const controller =
          new PaymentController({
            capture,
            refund,
          } as unknown as
            PaymentService);

        await controller.capture(
          'payment-1',
          {
            idempotencyKey:
              'capture-1',
          },
        );

        await controller.refund(
          'payment-1',
          {
            idempotencyKey:
              'refund-1',
          },
        );

        expect(capture)
          .toHaveBeenCalled();

        expect(refund)
          .toHaveBeenCalled();
      },
    );
  },
);
