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

import { AppModule } from '../../src/app.module';
import { POSTGRES_POOL } from '../../src/database/postgres';
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

    const marketplacePluginId =
      randomUUID();

    const slug =
      `marketplace-test-${marketplacePluginId}`;

    beforeAll(async () => {
      const moduleRef =
        await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

      app = moduleRef.createNestApplication();

      app.setGlobalPrefix('api/v1');

      await app.init();

      pool = app.get<Pool>(POSTGRES_POOL);

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
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            now()
          )
        `,
        [
          marketplacePluginId,
          slug,
          'Marketplace Test Plugin',
          'Cogzidel',
          '1.0.0',
          'Marketplace integration fixture',
          'operations',
          true,
        ],
      );
    });

    afterAll(async () => {
      if (pool) {
        await pool.query(
          `
            DELETE FROM marketplace_plugins
            WHERE id = $1
          `,
          [marketplacePluginId],
        );
      }

      if (auth) {
        await auth.cleanup();
      }

      if (app) {
        await app.close();
      }
    });

    it(
      'lists marketplace plugins',
      async () => {
        const response =
          await request(app.getHttpServer())
            .get('/api/v1/marketplace')
            .set(
              'Authorization',
              `Bearer ${auth.accessToken}`,
            )
            .expect(200);

        expect(
          Array.isArray(response.body),
        ).toBe(true);

        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: marketplacePluginId,
              slug,
              name:
                'Marketplace Test Plugin',
              vendor: 'Cogzidel',
              latestVersion: '1.0.0',
              verified: true,
            }),
          ]),
        );
      },
    );

    it(
      'returns marketplace plugin details',
      async () => {
        const response =
          await request(app.getHttpServer())
            .get(
              `/api/v1/marketplace/${slug}`,
            )
            .set(
              'Authorization',
              `Bearer ${auth.accessToken}`,
            )
            .expect(200);

        expect(response.body).toMatchObject({
          id: marketplacePluginId,
          slug,
          latestVersion: '1.0.0',
        });
      },
    );

    it(
      'returns 404 for an unknown plugin',
      async () => {
        await request(app.getHttpServer())
          .get(
            '/api/v1/marketplace/missing-plugin',
          )
          .set(
            'Authorization',
            `Bearer ${auth.accessToken}`,
          )
          .expect(404);
      },
    );
  },
);
