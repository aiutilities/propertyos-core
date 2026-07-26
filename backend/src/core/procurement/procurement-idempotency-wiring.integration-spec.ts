import 'reflect-metadata';

import {
  INTERCEPTORS_METADATA,
} from '@nestjs/common/constants';
import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Request,
} from 'express';

import {
  IDEMPOTENT_OPERATION_METADATA,
  IdempotentOperationOptions,
} from '../platform/idempotency/decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyInterceptor,
} from '../platform/idempotency/http/platform-idempotency.interceptor';
import {
  ProcurementGoodsReceiptController,
} from './controllers/procurement-goods-receipt.controller';
import {
  ProcurementInvoiceMatchController,
} from './controllers/procurement-invoice-match.controller';
import {
  ProcurementPaymentRequestController,
} from './controllers/procurement-payment-request.controller';
import {
  ProcurementPurchaseOrderController,
} from './controllers/procurement-purchase-order.controller';

interface ProcurementWiringCase {
  name: string;
  handler: Function;
  operation: string;
  id: string;
  expectedResource: string;
}

const cases:
  ProcurementWiringCase[] = [
    {
      name:
        'goods receipt post',
      handler:
        ProcurementGoodsReceiptController
          .prototype.postReceipt,
      operation:
        'procurement.goods-receipt.post',
      id:
        'receipt-1',
      expectedResource:
        'procurement-goods-receipt:receipt-1',
    },
    {
      name:
        'purchase order issue',
      handler:
        ProcurementPurchaseOrderController
          .prototype.issue,
      operation:
        'procurement.purchase-order.issue',
      id:
        'purchase-order-1',
      expectedResource:
        'procurement-purchase-order:purchase-order-1',
    },
    {
      name:
        'payment request pay',
      handler:
        ProcurementPaymentRequestController
          .prototype.pay,
      operation:
        'procurement.payment-request.pay',
      id:
        'payment-request-1',
      expectedResource:
        'procurement-payment-request:payment-request-1',
    },
    {
      name:
        'invoice match complete',
      handler:
        ProcurementInvoiceMatchController
          .prototype.complete,
      operation:
        'procurement.invoice-match.complete',
      id:
        'invoice-match-1',
      expectedResource:
        'procurement-invoice-match:invoice-match-1',
    },
  ];

describe(
  'Procurement posting idempotency wiring',
  () => {
    it.each(
      cases,
    )(
      'requires idempotency for $name',
      ({
        handler,
        operation,
        id,
        expectedResource,
      }) => {
        const interceptors =
          Reflect.getMetadata(
            INTERCEPTORS_METADATA,
            handler,
          ) as
            unknown[] |
            undefined;

        expect(
          interceptors,
        ).toContain(
          PlatformIdempotencyInterceptor,
        );

        const options =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            handler,
          ) as
            IdempotentOperationOptions |
            undefined;

        expect(
          options,
        ).toBeDefined();

        expect(
          options,
        ).toMatchObject({
          operation,
          required:
            true,
          expiresInSeconds:
            24 * 60 * 60,
        });

        const request = {
          params: {
            id,
          },
        } as unknown as
          Request;

        expect(
          options?.resource(
            request,
          ),
        ).toBe(
          expectedResource,
        );
      },
    );

    it(
      'uses distinct operation scopes for all four procurement actions',
      () => {
        const operations =
          cases.map(
            ({
              handler,
            }) => {
              const options =
                Reflect.getMetadata(
                  IDEMPOTENT_OPERATION_METADATA,
                  handler,
                ) as
                  IdempotentOperationOptions;

              return options.operation;
            },
          );

        expect(
          new Set(
            operations,
          ).size,
        ).toBe(
          cases.length,
        );
      },
    );

    it(
      'does not apply posting idempotency to compensating reversal',
      () => {
        const metadata =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            ProcurementGoodsReceiptController
              .prototype.reverse,
          );

        expect(
          metadata,
        ).toBeUndefined();
      },
    );

    it(
      'does not apply posting idempotency to approval transitions',
      () => {
        const purchaseOrderApproval =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            ProcurementPurchaseOrderController
              .prototype.approve,
          );

        const invoiceApproval =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            ProcurementInvoiceMatchController
              .prototype.approve,
          );

        expect(
          purchaseOrderApproval,
        ).toBeUndefined();

        expect(
          invoiceApproval,
        ).toBeUndefined();
      },
    );
  },
);
