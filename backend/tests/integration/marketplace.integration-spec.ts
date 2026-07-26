import {
  INestApplication,
} from '@nestjs/common';
import {
  Test,
} from '@nestjs/testing';
import {
  randomUUID,
} from 'crypto';
import {
  Pool,
} from 'pg';
import request from 'supertest';

import {
  AppModule,
} from '../../src/app.module';
import {
  POSTGRES_POOL,
} from '../../src/database/postgres';
import {
  IntegrationAuthContext,
  provisionIntegrationAdmin,
} from './helpers/integration-auth.helper';

describe(
  'Marketplace API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let auth: IntegrationAuthContext;

    const verifiedPluginId =
      randomUUID();

    const communityPluginId =
      randomUUID();

    const verifiedSlug =
      `marketplace-operations-${verifiedPluginId}`;

    const communitySlug =
      `marketplace-finance-${communityPluginId}`;

    beforeAll(async () => {
      const moduleRef =
        await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

      app =
        moduleRef.createNestApplication();

      app.setGlobalPrefix('api/v1');

      await app.init();

      pool =
        app.get<Pool>(POSTGRES_POOL);

      auth =
        await provisionIntegrationAdmin(
          app,
          'marketplace',
        );

      await pool.query(
        `
          INSERT INTO marketplace_plugins
          (
            id,
            slug,
            name,
            vendor,
            latest_version,
            description,
            category,
            verified,
            published_at
          )
          VALUES
          (
            $1,
            $2,
            'Maintenance Command Center',
            'Cogzidel',
            '1.0.0',
            'Maintenance operations plugin',
            'operations',
            true,
            now()
          ),
          (
            $3,
            $4,
            'Community Finance Exporter',
            'Community Labs',
            '0.5.0',
            'Finance export integration',
            'finance',
            false,
            now() - interval '1 day'
          )
        `,
        [
          verifiedPluginId,
          verifiedSlug,
          communityPluginId,
          communitySlug,
        ],
      );
    });

    afterAll(async () => {
      if (pool) {
        await pool.query(
          `
            DELETE FROM marketplace_plugins
            WHERE id = ANY($1::uuid[])
          `,
          [[
            verifiedPluginId,
            communityPluginId,
          ]],
        );
      }

      if (auth) {
        await auth.cleanup();
      }

      if (app) {
        await app.close();
      }
    });

    const authenticatedGet = (
      path: string,
    ) => {
      return request(app.getHttpServer())
        .get(path)
        .set(
          'Authorization',
          `Bearer ${auth.accessToken}`,
        );
    };

    it(
      'returns a paginated marketplace catalogue',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace'
            + '?page=1&limit=20',
          ).expect(200);

        expect(response.body).toMatchObject({
          page: 1,
          limit: 20,
        });

        expect(
          Array.isArray(response.body.items),
        ).toBe(true);

        expect(response.body.total)
          .toBeGreaterThanOrEqual(2);

        expect(response.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: verifiedPluginId,
              slug: verifiedSlug,
              latestVersion: '1.0.0',
            }),
            expect.objectContaining({
              id: communityPluginId,
              slug: communitySlug,
              latestVersion: '0.5.0',
            }),
          ]),
        );
      },
    );

    it(
      'searches catalogue text',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace'
            + '?q=Maintenance',
          ).expect(200);

        expect(response.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: verifiedPluginId,
            }),
          ]),
        );

        expect(
          response.body.items.some(
            (item: { id: string }) =>
              item.id === communityPluginId,
          ),
        ).toBe(false);
      },
    );

    it(
      'filters by category and verification',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace'
            + '?category=operations'
            + '&verified=true',
          ).expect(200);

        expect(response.body.items).toEqual([
          expect.objectContaining({
            id: verifiedPluginId,
            category: 'operations',
            verified: true,
          }),
        ]);
      },
    );

    it(
      'filters by vendor case-insensitively',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace'
            + '?vendor=community%20labs',
          ).expect(200);

        expect(response.body.items).toEqual([
          expect.objectContaining({
            id: communityPluginId,
            vendor: 'Community Labs',
          }),
        ]);
      },
    );

    it(
      'applies pagination and deterministic sorting',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace'
            + '?sort=name'
            + '&direction=asc'
            + '&page=1'
            + '&limit=1',
          ).expect(200);

        expect(response.body).toMatchObject({
          page: 1,
          limit: 1,
        });

        expect(response.body.items)
          .toHaveLength(1);

        expect(response.body.total)
          .toBeGreaterThanOrEqual(2);

        expect(response.body.totalPages)
          .toBeGreaterThanOrEqual(2);
      },
    );

    it(
      'rejects invalid search parameters',
      async () => {
        await authenticatedGet(
          '/api/v1/marketplace'
          + '?verified=maybe',
        ).expect(400);

        await authenticatedGet(
          '/api/v1/marketplace'
          + '?limit=101',
        ).expect(400);

        await authenticatedGet(
          '/api/v1/marketplace'
          + '?sort=downloads',
        ).expect(400);
      },
    );

    it(
      'returns marketplace plugin details',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/${verifiedSlug}`,
          ).expect(200);

        expect(response.body).toMatchObject({
          id: verifiedPluginId,
          slug: verifiedSlug,
          latestVersion: '1.0.0',
        });
      },
    );

    it(
      'returns 404 for an unknown plugin',
      async () => {
        await authenticatedGet(
          '/api/v1/marketplace/missing-plugin',
        ).expect(404);
      },
    );
  },
);
