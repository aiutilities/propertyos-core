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
  MarketplaceController,
} from './controllers/marketplace.controller';
import {
  MarketplaceInstallController,
} from './install/controllers/marketplace-install.controller';
import {
  MarketplaceInstallService,
} from './install/services/marketplace-install.service';
import {
  MarketplaceRollbackController,
} from './rollback/controllers/marketplace-rollback.controller';
import {
  MarketplaceRollbackService,
} from './rollback/services/marketplace-rollback.service';
import {
  MarketplaceCatalogService,
} from './services/marketplace-catalog.service';
import {
  MarketplaceUninstallController,
} from './uninstall/controllers/marketplace-uninstall.controller';
import {
  MarketplaceUninstallService,
} from './uninstall/services/marketplace-uninstall.service';
import {
  MarketplaceUpgradeController,
} from './upgrade/controllers/marketplace-upgrade.controller';
import {
  MarketplaceUpgradeService,
} from './upgrade/services/marketplace-upgrade.service';
import {
  PlatformModule,
} from '../platform/platform.module';
import {
  PlatformIdempotencyContextBuilder,
} from '../platform/idempotency/http/platform-idempotency-context-builder.service';
import {
  PlatformIdempotencyInterceptor,
} from '../platform/idempotency/http/platform-idempotency.interceptor';

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
    const http =
      context.switchToHttp();

    const request =
      http.getRequest<
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
        'marketplace-http-idempotency-default',
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
  'Marketplace HTTP idempotency',
  () => {
    let app:
      INestApplication;

    let pool:
      Pool;

    const install =
      jest.fn(
        async (
          slug: string,
          version: string,
          actorId: string,
          autoEnable?: boolean,
          overwrite?: boolean,
          metadata:
            Record<string, unknown> = {},
        ) => ({
          operation:
            'install',
          slug,
          version,
          actorId,
          autoEnable:
            autoEnable ?? false,
          overwrite:
            overwrite ?? false,
          metadata,
        }),
      );

    const upgrade =
      jest.fn(
        async (
          slug: string,
          version: string,
          notes?: string,
        ) => ({
          operation:
            'upgrade',
          slug,
          version,
          notes:
            notes ?? null,
        }),
      );

    const rollback =
      jest.fn(
        async (
          slug: string,
          version: string,
          notes?: string,
        ) => ({
          operation:
            'rollback',
          slug,
          version,
          notes:
            notes ?? null,
        }),
      );

    const uninstall =
      jest.fn(
        async (
          slug: string,
        ) => ({
          operation:
            'uninstall',
          slug,
          status:
            'UNINSTALLED',
        }),
      );

    const list =
      jest.fn(
        async () => ({
          items: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        }),
      );

    const details =
      jest.fn(
        async (
          slug: string,
        ) => ({
          slug,
        }),
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
            'marketplace-http-idempotency-%'
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
                MarketplaceInstallController,
                MarketplaceUpgradeController,
                MarketplaceRollbackController,
                MarketplaceUninstallController,
                MarketplaceController,
              ],
              providers: [
                PlatformIdempotencyContextBuilder,
                PlatformIdempotencyInterceptor,
                {
                  provide:
                    MarketplaceInstallService,
                  useValue: {
                    install,
                  },
                },
                {
                  provide:
                    MarketplaceUpgradeService,
                  useValue: {
                    upgrade,
                  },
                },
                {
                  provide:
                    MarketplaceRollbackService,
                  useValue: {
                    rollback,
                  },
                },
                {
                  provide:
                    MarketplaceUninstallService,
                  useValue: {
                    uninstall,
                  },
                },
                {
                  provide:
                    MarketplaceCatalogService,
                  useValue: {
                    list,
                    details,
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
        install.mockClear();
        upgrade.mockClear();
        rollback.mockClear();
        uninstall.mockClear();
        list.mockClear();
        details.mockClear();

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
      'marketplace-http-idempotency-actor-1';

    const authorization = (
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

    it.each([
      {
        name:
          'install',
        path:
          '/api/v1/marketplace/example/versions/1.0.0/install',
        body: {
          autoEnable: true,
          overwrite: false,
          metadata: {
            source:
              'acceptance',
          },
        },
      },
      {
        name:
          'upgrade',
        path:
          '/api/v1/marketplace/example/versions/2.0.0/upgrade',
        body: {
          notes:
            'Upgrade accepted',
        },
      },
      {
        name:
          'rollback',
        path:
          '/api/v1/marketplace/example/versions/1.0.0/rollback',
        body: {
          notes:
            'Rollback accepted',
        },
      },
      {
        name:
          'uninstall',
        path:
          '/api/v1/marketplace/example/uninstall',
        body: {},
      },
    ])(
      'requires Idempotency-Key for $name',
      async ({
        path,
        body,
      }) => {
        const response =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .send(body),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          String(
            response.body
              ?.message ??
            response.body
              ?.error
              ?.message ??
            '',
          ),
        ).toContain(
          'Idempotency-Key',
        );
      },
    );

    it(
      'executes install once and replays the stored response',
      async () => {
        const key =
          'marketplace-http-request-0001';

        const path =
          '/api/v1/marketplace/example/versions/1.0.0/install';

        const body = {
          autoEnable:
            true,
          overwrite:
            false,
          metadata: {
            source:
              'acceptance',
          },
        };

        const first =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        const replay =
          await authorization(
            request(
              app.getHttpServer(),
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
          install,
        ).toHaveBeenCalledTimes(1);

        expect(
          install,
        ).toHaveBeenCalledWith(
          'example',
          '1.0.0',
          actor,
          true,
          false,
          {
            source:
              'acceptance',
          },
        );

        const rows =
          await pool.query<{
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
          rows.rows,
        ).toEqual([
          {
            operation:
              'marketplace.install',
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
      'rejects the same key with changed request body',
      async () => {
        const key =
          'marketplace-http-request-0002';

        const path =
          '/api/v1/marketplace/example/versions/1.0.0/install';

        const first =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  true,
                metadata: {
                  source:
                    'first',
                },
              }),
          );

        const conflict =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  false,
                metadata: {
                  source:
                    'changed',
                },
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          install,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rejects the same key for a different plugin resource',
      async () => {
        const key =
          'marketplace-http-request-0003';

        const first =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(
                '/api/v1/marketplace/example-a/versions/1.0.0/install',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  true,
              }),
          );

        const conflict =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(
                '/api/v1/marketplace/example-b/versions/1.0.0/install',
              )
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  true,
              }),
          );

        expect(
          first.status,
        ).toBe(201);

        expect(
          conflict.status,
        ).toBe(409);

        expect(
          install,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'scopes identical keys independently by actor',
      async () => {
        const key =
          'marketplace-http-request-0004';

        const path =
          '/api/v1/marketplace/example/versions/1.0.0/install';

        const actorOne =
          'marketplace-http-idempotency-actor-a';

        const actorTwo =
          'marketplace-http-idempotency-actor-b';

        const first =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  true,
              }),
            actorOne,
          );

        const second =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send({
                autoEnable:
                  true,
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
          install,
        ).toHaveBeenCalledTimes(2);

        expect(
          install.mock.calls.map(
            (call) =>
              call[2],
          ),
        ).toEqual([
          actorOne,
          actorTwo,
        ]);
      },
    );

    it.each([
      {
        name:
          'upgrade',
        path:
          '/api/v1/marketplace/example/versions/2.0.0/upgrade',
        body: {
          notes:
            'Upgrade acceptance',
        },
        service:
          upgrade,
      },
      {
        name:
          'rollback',
        path:
          '/api/v1/marketplace/example/versions/1.0.0/rollback',
        body: {
          notes:
            'Rollback acceptance',
        },
        service:
          rollback,
      },
      {
        name:
          'uninstall',
        path:
          '/api/v1/marketplace/example/uninstall',
        body: {},
        service:
          uninstall,
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
          `marketplace-http-${name}-0001`;

        const first =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .post(path)
              .set(
                'Idempotency-Key',
                key,
              )
              .send(body),
          );

        const replay =
          await authorization(
            request(
              app.getHttpServer(),
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
      'leaves read-only Marketplace routes unaffected',
      async () => {
        const response =
          await authorization(
            request(
              app.getHttpServer(),
            )
              .get(
                '/api/v1/marketplace',
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
          list,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
