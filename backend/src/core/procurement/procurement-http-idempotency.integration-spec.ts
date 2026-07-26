import 'reflect-metadata';

import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
} from 'pg';
import request from 'supertest';

import {
  POSTGRES_POOL,
} from '../../database/postgres';
import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../auth/guards/permission.guard';
import {
  PlatformIdempotencyContextBuilder,
} from '../platform/idempotency/http/platform-idempotency-context-builder.service';
import {
  PlatformIdempotencyInterceptor,
} from '../platform/idempotency/http/platform-idempotency.interceptor';
import {
  PlatformModule,
} from '../platform/platform.module';
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
import {
  ProcurementGoodsReceiptService,
} from './services/procurement-goods-receipt.service';
import {
  ProcurementInvoiceMatchService,
} from './services/procurement-invoice-match.service';
import {
  ProcurementPaymentRequestService,
} from './services/procurement-payment-request.service';
import {
  ProcurementPurchaseOrderService,
} from './services/procurement-purchase-order.service';

type HttpRequestWithActor = {
  headers:
    Record<
      string,
      string | string[] | undefined
    >;
  user?: {
    sub: string;
  };
};

class TestActorGuard
  implements CanActivate {
  canActivate(
    context:
      ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<
          HttpRequestWithActor
        >();

    const header =
      request.headers[
        'x-test-actor'
      ];

    const actor =
      Array.isArray(header)
        ? header[0]
        : header;

    request.user = {
      sub:
        actor?.trim() ||
        'procurement-http-idempotency-default',
    };

    return true;
  }
}

class TestPermissionGuard
  implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe(
  'Procurement HTTP idempotency',
  () => {
    let app:
      INestApplication | undefined;

    let pool:
      Pool | undefined;

    const postGoodsReceipt =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'goods-receipt-post',
          id,
          dto,
        }),
      );

    const issuePurchaseOrder =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'purchase-order-issue',
          id,
          dto,
        }),
      );

    const payPaymentRequest =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'payment-request-pay',
          id,
          dto,
        }),
      );

    const completeInvoiceMatch =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'invoice-match-complete',
          id,
          dto,
        }),
      );

    const listGoodsReceipts =
      jest.fn(
        async () => [],
      );

    const cleanRows =
      async () => {
        if (pool === undefined) {
          return;
        }

        await pool.query(
          `
          DELETE FROM core_idempotency_requests
          WHERE actor_id LIKE
            'procurement-http-idempotency-%'
          `,
        );
      };

    beforeAll(
      async () => {
        const moduleRef:
          TestingModule =
          await Test
            .createTestingModule({
              imports: [
                PlatformModule,
              ],
              controllers: [
                ProcurementGoodsReceiptController,
                ProcurementPurchaseOrderController,
                ProcurementPaymentRequestController,
                ProcurementInvoiceMatchController,
              ],
              providers: [
                PlatformIdempotencyContextBuilder,
                PlatformIdempotencyInterceptor,
                {
                  provide:
                    ProcurementGoodsReceiptService,
                  useValue: {
                    post:
                      postGoodsReceipt,
                    list:
                      listGoodsReceipts,
                    create:
                      jest.fn(),
                    get:
                      jest.fn(),
                    update:
                      jest.fn(),
                    reverse:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    ProcurementPurchaseOrderService,
                  useValue: {
                    issue:
                      issuePurchaseOrder,
                    list:
                      jest.fn(
                        async () => [],
                      ),
                    create:
                      jest.fn(),
                    get:
                      jest.fn(),
                    update:
                      jest.fn(),
                    submitForApproval:
                      jest.fn(),
                    approve:
                      jest.fn(),
                    acknowledge:
                      jest.fn(),
                    markReceived:
                      jest.fn(),
                    close:
                      jest.fn(),
                    cancel:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    ProcurementPaymentRequestService,
                  useValue: {
                    pay:
                      payPaymentRequest,
                    list:
                      jest.fn(
                        async () => [],
                      ),
                    create:
                      jest.fn(),
                    get:
                      jest.fn(),
                    update:
                      jest.fn(),
                    submit:
                      jest.fn(),
                    approve:
                      jest.fn(),
                    reject:
                      jest.fn(),
                    cancel:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    ProcurementInvoiceMatchService,
                  useValue: {
                    complete:
                      completeInvoiceMatch,
                    list:
                      jest.fn(
                        async () => [],
                      ),
                    create:
                      jest.fn(),
                    get:
                      jest.fn(),
                    update:
                      jest.fn(),
                    approve:
                      jest.fn(),
                    reject:
                      jest.fn(),
                  },
                },
              ],
            })
            .overrideGuard(
              JwtAuthGuard,
            )
            .useClass(
              TestActorGuard,
            )
            .overrideGuard(
              PermissionGuard,
            )
            .useClass(
              TestPermissionGuard,
            )
            .compile();

        app =
          moduleRef
            .createNestApplication();

        app.setGlobalPrefix(
          'api/v1',
        );

        await app.init();

        pool =
          moduleRef.get<Pool>(
            POSTGRES_POOL,
          );

        await cleanRows();
      },
    );

    beforeEach(
      async () => {
        postGoodsReceipt.mockClear();
        issuePurchaseOrder.mockClear();
        payPaymentRequest.mockClear();
        completeInvoiceMatch.mockClear();
        listGoodsReceipts.mockClear();

        await cleanRows();
      },
    );

    afterAll(
      async () => {
        await cleanRows();

        if (app !== undefined) {
          await app.close();
        }
      },
    );

    const actor =
      'procurement-http-idempotency-actor-1';

    const authorize = (
      input:
        request.Test,
      testActor = actor,
    ) =>
      input
        .set(
          'Authorization',
          'Bearer test-token',
        )
        .set(
          'X-Test-Actor',
          testActor,
        );

    const server = () => {
      if (app === undefined) {
        throw new Error(
          'Nest application is not initialized',
        );
      }

      return app.getHttpServer();
    };

    it.each([
      {
        name:
          'goods receipt post',
        path:
          '/api/v1/procurement/goods-receipts/receipt-1/post',
        body: {
          postedByPersonId:
            'person-1',
        },
      },
      {
        name:
          'purchase order issue',
        path:
          '/api/v1/procurement/purchase-orders/po-1/issue',
        body: {
          changedByPersonId:
            'person-1',
        },
      },
      {
        name:
          'payment request pay',
        path:
          '/api/v1/procurement/payment-requests/payment-1/pay',
        body: {
          paidByPersonId:
            'person-1',
          paymentReference:
            'PAY-001',
        },
      },
      {
        name:
          'invoice match complete',
        path:
          '/api/v1/procurement/invoice-matches/invoice-1/complete',
        body: {
          completedByPersonId:
            'person-1',
        },
      },
    ])(
      'requires Idempotency-Key for $name',
      async ({
        path,
        body,
      }) => {
        const response =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .send(body),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          JSON.stringify(
            response.body,
          ),
        ).toContain(
          'Idempotency-Key',
        );
      },
    );

    it(
      'executes goods receipt posting once and replays the stored response',
      async () => {
        const key =
          'procurement-http-request-0001';

        const path =
          '/api/v1/procurement/goods-receipts/receipt-1/post';

        const body = {
          postedByPersonId:
            'person-1',
          remarks:
            'Receipt posted',
        };

        const first =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        const replay =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          replay.status,
        ).toBe(201);

        expect(
          first.headers[
            'idempotency-replayed'
          ],
        ).toBe('false');

        expect(
          replay.headers[
            'idempotency-replayed'
          ],
        ).toBe('true');

        expect(
          replay.body,
        ).toEqual(
          first.body,
        );

        expect(
          postGoodsReceipt,
        ).toHaveBeenCalledTimes(1);

        const rows =
          await pool?.query<{
            operation: string;
            status: string;
            response_status:
              number;
            attempt_number:
              number;
          }>(
            `
            SELECT
              operation,
              status,
              response_status,
              attempt_number
            FROM core_idempotency_requests
            WHERE actor_id = $1
              AND idempotency_key = $2
            `,
            [
              actor,
              key,
            ],
          );

        expect(
          rows?.rows,
        ).toEqual([
          {
            operation:
              'procurement.goods-receipt.post',
            status:
              'COMPLETE',
            response_status:
              201,
            attempt_number:
              1,
          },
        ]);
      },
    );

    it(
      'rejects the same key with changed body',
      async () => {
        const key =
          'procurement-http-request-0002';

        const path =
          '/api/v1/procurement/payment-requests/payment-1/pay';

        const first =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                paidByPersonId:
                  'person-1',
                paymentReference:
                  'PAY-001',
              }),
          );

        const conflict =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                paidByPersonId:
                  'person-1',
                paymentReference:
                  'PAY-CHANGED',
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          payPaymentRequest,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rejects the same key for a different resource',
      async () => {
        const key =
          'procurement-http-request-0003';

        const first =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/procurement/purchase-orders/po-a/issue',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                changedByPersonId:
                  'person-1',
              }),
          );

        const conflict =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/procurement/purchase-orders/po-b/issue',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                changedByPersonId:
                  'person-1',
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          issuePurchaseOrder,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'scopes identical keys independently by actor',
      async () => {
        const key =
          'procurement-http-request-0004';

        const path =
          '/api/v1/procurement/invoice-matches/invoice-1/complete';

        const actorOne =
          'procurement-http-idempotency-actor-a';

        const actorTwo =
          'procurement-http-idempotency-actor-b';

        const first =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                completedByPersonId:
                  'person-1',
              }),
            actorOne,
          );

        const second =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                completedByPersonId:
                  'person-1',
              }),
            actorTwo,
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          second.status,
        ).toBe(201);

        expect(
          first.headers[
            'idempotency-replayed'
          ],
        ).toBe('false');

        expect(
          second.headers[
            'idempotency-replayed'
          ],
        ).toBe('false');

        expect(
          completeInvoiceMatch,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it.each([
      {
        name:
          'purchase order issue',
        path:
          '/api/v1/procurement/purchase-orders/po-1/issue',
        body: {
          changedByPersonId:
            'person-1',
        },
        service:
          issuePurchaseOrder,
      },
      {
        name:
          'payment request pay',
        path:
          '/api/v1/procurement/payment-requests/payment-1/pay',
        body: {
          paidByPersonId:
            'person-1',
          paymentReference:
            'PAY-001',
        },
        service:
          payPaymentRequest,
      },
      {
        name:
          'invoice match complete',
        path:
          '/api/v1/procurement/invoice-matches/invoice-1/complete',
        body: {
          completedByPersonId:
            'person-1',
        },
        service:
          completeInvoiceMatch,
      },
    ])(
      'replays $name without executing its service twice',
      async ({
        name,
        path,
        body,
        service,
      }) => {
        const key =
          `procurement-http-${name
            .replace(/\s+/g, '-')
            .toLowerCase()}-0001`;

        const first =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        const replay =
          await authorize(
            request(
              server(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          replay.status,
        ).toBe(201);

        expect(
          replay.headers[
            'idempotency-replayed'
          ],
        ).toBe('true');

        expect(
          replay.body,
        ).toEqual(
          first.body,
        );

        expect(
          service,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'keeps identical keys independent across different operations',
      async () => {
        const key =
          'procurement-http-request-0005';

        const issue =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/procurement/purchase-orders/po-1/issue',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                changedByPersonId:
                  'person-1',
              }),
          );

        const pay =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/procurement/payment-requests/payment-1/pay',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                paidByPersonId:
                  'person-1',
                paymentReference:
                  'PAY-001',
              }),
          );

        expect(
          issue.status,
        ).toBe(201);

        expect(
          pay.status,
        ).toBe(201);

        expect(
          issuePurchaseOrder,
        ).toHaveBeenCalledTimes(1);

        expect(
          payPaymentRequest,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'leaves read-only Procurement routes unaffected',
      async () => {
        const response =
          await authorize(
            request(
              server(),
            )
              .get(
                '/api/v1/procurement/goods-receipts',
              ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          response.headers[
            'idempotency-replayed'
          ],
        ).toBeUndefined();

        expect(
          listGoodsReceipts,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
