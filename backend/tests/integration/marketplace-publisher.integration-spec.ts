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
  'Marketplace publisher API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let auth: IntegrationAuthContext;

    const publisherId =
      `marketplace-publisher-${randomUUID()}`;

    const keyId =
      `marketplace-key-${randomUUID()}`;

    const pluginId =
      randomUUID();

    const slug =
      `publisher-plugin-${pluginId}`;

    const fingerprint =
      'a'.repeat(64);

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
          'marketplace-publisher',
        );

      await pool.query(
        `
          INSERT INTO plugin_publishers
          (
            id,
            display_name,
            status,
            metadata
          )
          VALUES
          (
            $1,
            'Cogzidel Marketplace Publisher',
            'ACTIVE',
            $2::jsonb
          )
        `,
        [
          publisherId,
          JSON.stringify({
            description:
              'Verified PropertyOS publisher',
            homepage:
              'https://example.test/publisher',
            logoUrl:
              'https://example.test/logo.svg',
          }),
        ],
      );

      await pool.query(
        `
          INSERT INTO plugin_publisher_keys
          (
            key_id,
            publisher_id,
            algorithm,
            public_key_pem,
            fingerprint_sha256,
            status
          )
          VALUES
          (
            $1,
            $2,
            'RSA-SHA256',
            'TEST PUBLIC KEY',
            $3,
            'ACTIVE'
          )
        `,
        [
          keyId,
          publisherId,
          fingerprint,
        ],
      );

      await pool.query(
        `
          INSERT INTO marketplace_plugins
          (
            id,
            publisher_id,
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
            'Publisher Profile Plugin',
            'Cogzidel Marketplace Publisher',
            '1.2.0',
            'Publisher projection fixture',
            'operations',
            true,
            NOW()
          )
        `,
        [
          pluginId,
          publisherId,
          slug,
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
          [pluginId],
        );

        await pool.query(
          `
            DELETE FROM plugin_publisher_keys
            WHERE key_id = $1
          `,
          [keyId],
        );

        await pool.query(
          `
            DELETE FROM plugin_publishers
            WHERE id = $1
          `,
          [publisherId],
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
    ) => request(app.getHttpServer())
      .get(path)
      .set(
        'Authorization',
        `Bearer ${auth.accessToken}`,
      );

    it(
      'lists marketplace publishers',
      async () => {
        const response =
          await authenticatedGet(
            '/api/v1/marketplace/publishers',
          ).expect(200);

        expect(
          Array.isArray(response.body),
        ).toBe(true);

        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              publisherId,
              displayName:
                'Cogzidel Marketplace Publisher',
              status: 'ACTIVE',
              verified: true,
              pluginCount: 1,
              publicKeyFingerprint:
                fingerprint,
            }),
          ]),
        );
      },
    );

    it(
      'returns a publisher profile with plugins',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/publishers/${publisherId}`,
          ).expect(200);

        expect(response.body).toMatchObject({
          publisherId,
          verified: true,
          pluginCount: 1,
          description:
            'Verified PropertyOS publisher',
          homepage:
            'https://example.test/publisher',
          logoUrl:
            'https://example.test/logo.svg',
          publicKeyFingerprint:
            fingerprint,
        });

        expect(response.body.plugins).toEqual([
          expect.objectContaining({
            id: pluginId,
            slug,
            latestVersion: '1.2.0',
          }),
        ]);
      },
    );

    it(
      'lists plugins belonging to a publisher',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/publishers/${publisherId}/plugins`,
          ).expect(200);

        expect(response.body).toEqual([
          expect.objectContaining({
            id: pluginId,
            slug,
          }),
        ]);
      },
    );

    it(
      'returns 404 for an unknown publisher',
      async () => {
        await authenticatedGet(
          '/api/v1/marketplace/publishers/missing-publisher',
        ).expect(404);

        await authenticatedGet(
          '/api/v1/marketplace/publishers/missing-publisher/plugins',
        ).expect(404);
      },
    );
  },
);
