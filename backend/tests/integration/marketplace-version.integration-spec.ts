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
  'Marketplace version API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let auth: IntegrationAuthContext;

    const publisherId =
      `marketplace-version-publisher-${randomUUID()}`;

    const keyId =
      `marketplace-version-key-${randomUUID()}`;

    const marketplacePluginId =
      randomUUID();

    const emptyMarketplacePluginId =
      randomUUID();

    const slug =
      `marketplace-version-${randomUUID()}`;

    const emptySlug =
      `marketplace-empty-version-${randomUUID()}`;

    const approvedV1Id =
      randomUUID();

    const approvedV2Id =
      randomUUID();

    const rejectedV3Id =
      randomUUID();

    const artifactV1Id =
      randomUUID();

    const artifactV2Id =
      randomUUID();

    const artifactV3Id =
      randomUUID();

    const hashV1 =
      '1'.repeat(64);

    const integrityV1 =
      '2'.repeat(64);

    const hashV2 =
      '3'.repeat(64);

    const integrityV2 =
      '4'.repeat(64);

    const hashV3 =
      '5'.repeat(64);

    const integrityV3 =
      '6'.repeat(64);

    beforeAll(async () => {
      const moduleRef =
        await Test.createTestingModule({
          imports: [
            AppModule,
          ],
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
          'marketplace-version',
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
            'Marketplace Version Publisher',
            'ACTIVE',
            '{}'::jsonb
          )
        `,
        [
          publisherId,
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
          'a'.repeat(64),
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
            'Version Projection Plugin',
            'Marketplace Version Publisher',
            '2.0.0',
            'Approved publication projection fixture',
            'operations',
            true,
            NOW()
          ),
          (
            $4,
            $2,
            $5,
            'Empty Version Plugin',
            'Marketplace Version Publisher',
            '0.0.0',
            'Plugin without approved publications',
            'operations',
            true,
            NOW()
          )
        `,
        [
          marketplacePluginId,
          publisherId,
          slug,
          emptyMarketplacePluginId,
          emptySlug,
        ],
      );

      await pool.query(
        `
          INSERT INTO plugin_publications
          (
            id,
            plugin_id,
            plugin_name,
            version,
            publisher_id,
            key_id,
            artifact_storage_object_id,
            artifact_sha256,
            integrity_sha256,
            status,
            submitted_by,
            submitted_at,
            reviewed_by,
            reviewed_at,
            decision_reason,
            metadata
          )
          VALUES
          (
            $1,
            $2,
            'Version Projection Plugin',
            '1.0.0',
            $3,
            $4,
            $5,
            $6,
            $7,
            'APPROVED',
            'marketplace-version-test',
            NOW() - INTERVAL '3 days',
            'marketplace-version-reviewer',
            NOW() - INTERVAL '2 days',
            'Approved for marketplace',
            $8::jsonb
          ),
          (
            $9,
            $2,
            'Version Projection Plugin',
            '2.0.0',
            $3,
            $4,
            $10,
            $11,
            $12,
            'APPROVED',
            'marketplace-version-test',
            NOW() - INTERVAL '2 days',
            'marketplace-version-reviewer',
            NOW() - INTERVAL '1 day',
            'Approved for marketplace',
            $13::jsonb
          ),
          (
            $14,
            $2,
            'Version Projection Plugin',
            '3.0.0',
            $3,
            $4,
            $15,
            $16,
            $17,
            'REJECTED',
            'marketplace-version-test',
            NOW() - INTERVAL '1 day',
            'marketplace-version-reviewer',
            NOW(),
            'Rejected publication fixture',
            $18::jsonb
          )
        `,
        [
          approvedV1Id,
          slug,
          publisherId,
          keyId,
          artifactV1Id,
          hashV1,
          integrityV1,
          JSON.stringify({
            minimumPlatformVersion:
              '1.0.0',
            changelog:
              'Initial stable release',
          }),
          approvedV2Id,
          artifactV2Id,
          hashV2,
          integrityV2,
          JSON.stringify({
            minimumPlatformVersion:
              '1.5.0',
            changelog:
              'Second major release',
          }),
          rejectedV3Id,
          artifactV3Id,
          hashV3,
          integrityV3,
          JSON.stringify({
            minimumPlatformVersion:
              '2.0.0',
            changelog:
              'Rejected release',
          }),
        ],
      );
    });

    afterAll(async () => {
      if (pool) {
        await pool.query(
          `
            DELETE FROM plugin_publications
            WHERE id = ANY($1::uuid[])
          `,
          [[
            approvedV1Id,
            approvedV2Id,
            rejectedV3Id,
          ]],
        );

        await pool.query(
          `
            DELETE FROM marketplace_plugins
            WHERE id = ANY($1::uuid[])
          `,
          [[
            marketplacePluginId,
            emptyMarketplacePluginId,
          ]],
        );

        await pool.query(
          `
            DELETE FROM plugin_publisher_keys
            WHERE key_id = $1
          `,
          [
            keyId,
          ],
        );

        await pool.query(
          `
            DELETE FROM plugin_publishers
            WHERE id = $1
          `,
          [
            publisherId,
          ],
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
      'lists approved publications as marketplace versions',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/${slug}/versions`,
          ).expect(200);

        expect(response.body).toHaveLength(2);

        expect(response.body[0]).toMatchObject({
          publicationId:
            approvedV2Id,
          pluginId:
            slug,
          publisherId,
          publisherKeyId:
            keyId,
          version:
            '2.0.0',
          artifactStorageObjectId:
            artifactV2Id,
          artifactSha256:
            hashV2,
          integritySha256:
            integrityV2,
          minimumPlatformVersion:
            '1.5.0',
          changelog:
            'Second major release',
          verified:
            true,
          latest:
            true,
        });

        expect(response.body[1]).toMatchObject({
          publicationId:
            approvedV1Id,
          version:
            '1.0.0',
          latest:
            false,
        });

        expect(
          response.body.some(
            (
              item: {
                version: string;
              },
            ) =>
              item.version === '3.0.0',
          ),
        ).toBe(false);
      },
    );

    it(
      'returns an approved marketplace version',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/${slug}/versions/1.0.0`,
          ).expect(200);

        expect(response.body).toMatchObject({
          publicationId:
            approvedV1Id,
          pluginId:
            slug,
          version:
            '1.0.0',
          artifactStorageObjectId:
            artifactV1Id,
          artifactSha256:
            hashV1,
          integritySha256:
            integrityV1,
          minimumPlatformVersion:
            '1.0.0',
          changelog:
            'Initial stable release',
          verified:
            true,
          latest:
            false,
        });
      },
    );

    it(
      'does not expose rejected publications',
      async () => {
        await authenticatedGet(
          `/api/v1/marketplace/${slug}/versions/3.0.0`,
        ).expect(404);
      },
    );

    it(
      'returns an empty version list for a known plugin without approved releases',
      async () => {
        const response =
          await authenticatedGet(
            `/api/v1/marketplace/${emptySlug}/versions`,
          ).expect(200);

        expect(response.body).toEqual([]);
      },
    );

    it(
      'returns 404 for an unknown marketplace plugin',
      async () => {
        await authenticatedGet(
          '/api/v1/marketplace/missing-version-plugin/versions',
        ).expect(404);
      },
    );
  },
);
