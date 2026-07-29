import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentTransactionRepository,
} from '../repositories';

import {
  PaymentRuntimeService,
} from '../runtime';

import {
  PaymentService,
} from './payment.service';

function payment(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      'payment-1',

    source:
      'propertyos.invoice',

    sourceReferenceId:
      'invoice-1',

    providerName:
      'razorpay',

    providerPaymentId:
      'pay-1',

    idempotencyKey:
      'invoice-1-payment',

    status:
      'CAPTURED',

    money: {
      amountMinor:
        125000,

      currency:
        'INR',
    },

    metadata: {},

    createdAt:
      new Date(
        '2026-07-29T10:00:00.000Z',
      ),

    updatedAt:
      new Date(
        '2026-07-29T10:00:00.000Z',
      ),

    ...overrides,
  };
}

function createFixture(
  input: {
    existing?:
      ReturnType<
        typeof payment
      > |
      null;

    configuredProvider?:
      string;
  } = {},
) {
  const create =
    jest.fn(
      async (
        value:
          unknown,
      ) =>
        value,
    );

  const findById =
    jest.fn(
      async () =>
        input.existing ??
        payment(),
    );

  const createPayment =
    jest.fn(
      async () => ({
        paymentId:
          'payment-generated',

        success:
          true,

        providerName:
          'razorpay',

        providerOrderId:
          'order-1',

        status:
          'CREATED',
      }),
    );

  const capturePayment =
    jest.fn(
      async (
        _input:
          Record<string, unknown>,
      ) => ({
        paymentId:
          'payment-1',

        success:
          true,

        providerName:
          'razorpay',

        providerPaymentId:
          'pay-1',

        status:
          'CAPTURED',
      }),
    );

  const refundPayment =
    jest.fn(
      async (
        _input:
          Record<string, unknown>,
      ) => ({
        paymentId:
          'payment-1',

        success:
          true,

        providerName:
          'razorpay',

        providerPaymentId:
          'pay-1',

        providerRefundId:
          'refund-1',

        status:
          'REFUNDED',
      }),
    );

  const repository = {
    findByIdempotencyKey:
      jest.fn(
        async () =>
          input.existing ??
          null,
      ),

    create,
    findById,

    list:
      jest.fn(
        async () => [
          payment(),
        ],
      ),
  } as unknown as
    PaymentTransactionRepository;

  const runtime = {
    getConfiguredProvider:
      () =>
        input.configuredProvider ??
        'razorpay',

    getPaymentDispatcher:
      () => ({
        createPayment,
        capturePayment,
        refundPayment,
      }),
  } as unknown as
    PaymentRuntimeService;

  return {
    subject:
      new PaymentService(
        runtime,
        repository,
      ),

    create,
    findById,
    createPayment,
    capturePayment,
    refundPayment,
  };
}

describe(
  'PaymentService',
  () => {
    it(
      'creates the local transaction before provider dispatch',
      async () => {
        const fixture =
          createFixture({
            existing:
              null,
          });

        await fixture.subject.create({
          idempotencyKey:
            'invoice-1-payment',

          source:
            'propertyos.invoice',

          sourceReferenceId:
            'invoice-1',

          money: {
            amountMinor:
              125000,

            currency:
              'INR',
          },
        });

        expect(
          fixture.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              'CREATED',

            providerName:
              'razorpay',

            idempotencyKey:
              'invoice-1-payment',
          }),
        );

        expect(
          fixture.create
            .mock
            .invocationCallOrder[0],
        ).toBeLessThan(
          fixture.createPayment
            .mock
            .invocationCallOrder[0],
        );
      },
    );

    it(
      'returns a matching idempotent payment without redispatch',
      async () => {
        const existing =
          payment();

        const fixture =
          createFixture({
            existing,
          });

        await expect(
          fixture.subject.create({
            idempotencyKey:
              'invoice-1-payment',

            source:
              'propertyos.invoice',

            sourceReferenceId:
              'invoice-1',

            money: {
              amountMinor:
                125000,

              currency:
                'INR',
            },
          }),
        ).resolves.toEqual({
          duplicate:
            true,

          payment:
            existing,
        });

        expect(
          fixture.createPayment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects reuse of an idempotency key for different money',
      async () => {
        const fixture =
          createFixture({
            existing:
              payment(),
          });

        await expect(
          fixture.subject.create({
            idempotencyKey:
              'invoice-1-payment',

            source:
              'propertyos.invoice',

            sourceReferenceId:
              'invoice-1',

            money: {
              amountMinor:
                99999,

              currency:
                'INR',
            },
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );
      },
    );

    it(
      'returns not found for an unknown payment',
      async () => {
        const fixture =
          createFixture({
            existing:
              null,
          });

        fixture.findById
          .mockResolvedValueOnce(
            null,
          );

        await expect(
          fixture.subject.findById(
            'missing',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'captures through the configured provider',
      async () => {
        const fixture =
          createFixture({
            existing:
              payment({
                status:
                  'AUTHORIZED',
              }),
          });

        await fixture.subject.capture(
          'payment-1',
          {
            idempotencyKey:
              'capture-1',
          },
        );

        expect(
          fixture.capturePayment,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentId:
              'payment-1',

            providerName:
              'razorpay',

            request:
              expect.objectContaining({
                providerPaymentId:
                  'pay-1',

                idempotencyKey:
                  'capture-1',
              }),
          }),
        );
      },
    );

    it(
      'refunds a captured payment',
      async () => {
        const fixture =
          createFixture({
            existing:
              payment(),
          });

        await fixture.subject.refund(
          'payment-1',
          {
            idempotencyKey:
              'refund-1',

            reason:
              'Duplicate payment',
          },
        );

        expect(
          fixture.refundPayment,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentId:
              'payment-1',

            request:
              expect.objectContaining({
                providerPaymentId:
                  'pay-1',

                reason:
                  'Duplicate payment',
              }),
          }),
        );
      },
    );

    it(
      'lists repository payments using query filters',
      async () => {
        const fixture =
          createFixture();

        await expect(
          fixture.subject.list({
            providerName:
              'razorpay',

            status:
              'CAPTURED',
          }),
        ).resolves.toHaveLength(1);
      },
    );
  },
);
