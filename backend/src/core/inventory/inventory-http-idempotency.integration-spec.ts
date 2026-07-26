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
  PlatformModule,
} from '../platform/platform.module';
import {
  PlatformIdempotencyContextBuilder,
} from '../platform/idempotency/http/platform-idempotency-context-builder.service';
import {
  PlatformIdempotencyInterceptor,
} from '../platform/idempotency/http/platform-idempotency.interceptor';
import {
  InventoryMaterialIssueController,
} from './controllers/inventory-material-issue.controller';
import {
  InventoryMaterialReturnController,
} from './controllers/inventory-material-return.controller';
import {
  InventoryStockAdjustmentController,
} from './controllers/inventory-stock-adjustment.controller';
import {
  InventoryStockTransferController,
} from './controllers/inventory-stock-transfer.controller';
import {
  InventoryMaterialIssueService,
} from './services/inventory-material-issue.service';
import {
  InventoryMaterialReturnService,
} from './services/inventory-material-return.service';
import {
  InventoryStockAdjustmentService,
} from './services/inventory-stock-adjustment.service';
import {
  InventoryStockTransferService,
} from './services/inventory-stock-transfer.service';

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
        'inventory-http-idempotency-default',
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
  'Inventory HTTP idempotency',
  () => {
    let app:
      INestApplication | undefined;

    let pool:
      Pool | undefined;

    const postMaterialIssue =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'material-issue-post',
          id,
          dto,
        }),
      );

    const postMaterialReturn =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'material-return-post',
          id,
          dto,
        }),
      );

    const postAdjustment =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'stock-adjustment-post',
          id,
          dto,
        }),
      );

    const dispatchTransfer =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'stock-transfer-dispatch',
          id,
          dto,
        }),
      );

    const receiveTransfer =
      jest.fn(
        async (
          id: string,
          dto:
            Record<string, unknown>,
        ) => ({
          operation:
            'stock-transfer-receive',
          id,
          dto,
        }),
      );

    const listMaterialIssues =
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
            'inventory-http-idempotency-%'
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
                InventoryMaterialIssueController,
                InventoryMaterialReturnController,
                InventoryStockAdjustmentController,
                InventoryStockTransferController,
              ],
              providers: [
                PlatformIdempotencyContextBuilder,
                PlatformIdempotencyInterceptor,
                {
                  provide:
                    InventoryMaterialIssueService,
                  useValue: {
                    postMaterialIssue,
                    listMaterialIssues,
                    getMaterialIssue:
                      jest.fn(),
                    createMaterialIssue:
                      jest.fn(),
                    cancelMaterialIssue:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    InventoryMaterialReturnService,
                  useValue: {
                    postMaterialReturn,
                    listMaterialReturns:
                      jest.fn(
                        async () => [],
                      ),
                    getMaterialReturn:
                      jest.fn(),
                    createMaterialReturn:
                      jest.fn(),
                    cancelMaterialReturn:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    InventoryStockAdjustmentService,
                  useValue: {
                    postAdjustment,
                    listAdjustments:
                      jest.fn(
                        async () => [],
                      ),
                    getAdjustment:
                      jest.fn(),
                    createAdjustment:
                      jest.fn(),
                    cancelAdjustment:
                      jest.fn(),
                  },
                },
                {
                  provide:
                    InventoryStockTransferService,
                  useValue: {
                    dispatchTransfer,
                    receiveTransfer,
                    listTransfers:
                      jest.fn(
                        async () => [],
                      ),
                    getTransfer:
                      jest.fn(),
                    createTransfer:
                      jest.fn(),
                    cancelTransfer:
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
        postMaterialIssue.mockClear();
        postMaterialReturn.mockClear();
        postAdjustment.mockClear();
        dispatchTransfer.mockClear();
        receiveTransfer.mockClear();
        listMaterialIssues.mockClear();

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
      'inventory-http-idempotency-actor-1';

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
          'material issue post',
        path:
          '/api/v1/inventory/material-issues/issue-1/post',
        body: {
          postedBy:
            'operator-1',
        },
      },
      {
        name:
          'material return post',
        path:
          '/api/v1/inventory/material-returns/return-1/post',
        body: {
          postedBy:
            'operator-1',
        },
      },
      {
        name:
          'stock adjustment post',
        path:
          '/api/v1/inventory/adjustments/adjustment-1/post',
        body: {
          postedBy:
            'operator-1',
        },
      },
      {
        name:
          'stock transfer dispatch',
        path:
          '/api/v1/inventory/transfers/transfer-1/dispatch',
        body: {
          dispatchedBy:
            'operator-1',
        },
      },
      {
        name:
          'stock transfer receive',
        path:
          '/api/v1/inventory/transfers/transfer-1/receive',
        body: {
          receivedBy:
            'operator-1',
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
      'executes material issue posting once and replays the response',
      async () => {
        const key =
          'inventory-http-request-0001';

        const path =
          '/api/v1/inventory/material-issues/issue-1/post';

        const body = {
          postedBy:
            'operator-1',
          notes:
            'Issue posting',
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
          postMaterialIssue,
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
              'inventory.material-issue.post',
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
          'inventory-http-request-0002';

        const path =
          '/api/v1/inventory/adjustments/adjustment-1/post';

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
                postedBy:
                  'operator-1',
                notes:
                  'first',
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
                postedBy:
                  'operator-1',
                notes:
                  'changed',
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          postAdjustment,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rejects the same key for a different resource',
      async () => {
        const key =
          'inventory-http-request-0003';

        const first =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/inventory/material-returns/return-a/post',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                postedBy:
                  'operator-1',
              }),
          );

        const conflict =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/inventory/material-returns/return-b/post',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                postedBy:
                  'operator-1',
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          postMaterialReturn,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'scopes identical keys independently by actor',
      async () => {
        const key =
          'inventory-http-request-0004';

        const path =
          '/api/v1/inventory/transfers/transfer-1/dispatch';

        const actorOne =
          'inventory-http-idempotency-actor-a';

        const actorTwo =
          'inventory-http-idempotency-actor-b';

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
                dispatchedBy:
                  'operator-1',
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
                dispatchedBy:
                  'operator-1',
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
          dispatchTransfer,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it.each([
      {
        name:
          'material return post',
        path:
          '/api/v1/inventory/material-returns/return-1/post',
        body: {
          postedBy:
            'operator-1',
        },
        service:
          postMaterialReturn,
      },
      {
        name:
          'stock adjustment post',
        path:
          '/api/v1/inventory/adjustments/adjustment-1/post',
        body: {
          postedBy:
            'operator-1',
        },
        service:
          postAdjustment,
      },
      {
        name:
          'stock transfer dispatch',
        path:
          '/api/v1/inventory/transfers/transfer-1/dispatch',
        body: {
          dispatchedBy:
            'operator-1',
        },
        service:
          dispatchTransfer,
      },
      {
        name:
          'stock transfer receive',
        path:
          '/api/v1/inventory/transfers/transfer-1/receive',
        body: {
          receivedBy:
            'operator-1',
        },
        service:
          receiveTransfer,
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
          `inventory-http-${name
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
      'keeps dispatch and receive as separate operations on one resource',
      async () => {
        const key =
          'inventory-http-request-0005';

        const dispatch =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/inventory/transfers/transfer-1/dispatch',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                dispatchedBy:
                  'operator-1',
              }),
          );

        const receive =
          await authorize(
            request(
              server(),
            )
              .post(
                '/api/v1/inventory/transfers/transfer-1/receive',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                receivedBy:
                  'operator-1',
              }),
          );

        expect(
          dispatch.status,
        ).toBe(201);

        expect(
          receive.status,
        ).toBe(201);

        expect(
          dispatchTransfer,
        ).toHaveBeenCalledTimes(1);

        expect(
          receiveTransfer,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'leaves read-only Inventory routes unaffected',
      async () => {
        const response =
          await authorize(
            request(
              server(),
            )
              .get(
                '/api/v1/inventory/material-issues',
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
          listMaterialIssues,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
