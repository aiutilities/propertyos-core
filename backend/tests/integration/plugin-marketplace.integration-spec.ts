import {
  Test,
} from '@nestjs/testing';
import request from 'supertest';
import {
  AppModule,
} from '../../src/app.module';
import {
  PluginPublicationGovernanceService,
} from '../../src/core/plugin/publication/plugin-publication-governance.service';

describe(
  'Plugin Marketplace approved publication discovery',
  () => {
    let app: any;

    const approved = [
      publication({
        id:
          '11111111-1111-4111-8111-111111111111',
        version:
          '1.0.0',
        artifact_sha256:
          'a'.repeat(64),
        integrity_sha256:
          'b'.repeat(64),
        metadata: {
          description:
            'Approved visitor security plugin',
          category:
            'Visitor',
          tags: [
            'visitor',
            'security',
          ],
          minimumPlatformVersion:
            '0.1.0',
          changelog:
            'Initial release',
        },
      }),
      publication({
        id:
          '22222222-2222-4222-8222-222222222222',
        version:
          '1.1.0',
        artifact_storage_object_id:
          '44444444-4444-4444-8444-444444444444',
        artifact_sha256:
          'c'.repeat(64),
        integrity_sha256:
          'd'.repeat(64),
        metadata: {
          description:
            'Approved visitor security plugin',
          category:
            'Visitor',
          tags: [
            'visitor',
            'security',
          ],
          minimumPlatformVersion:
            '0.1.0',
          changelog:
            'Security hardening',
        },
      }),
    ];

    beforeAll(
      async () => {
        const moduleRef =
          await Test
            .createTestingModule({
              imports: [
                AppModule,
              ],
            })
            .overrideProvider(
              PluginPublicationGovernanceService,
            )
            .useValue({
              listApproved:
                async () =>
                  approved,
            })
            .compile();

        app =
          moduleRef
            .createNestApplication();
        app.setGlobalPrefix(
          'api/v1',
        );
        await app.init();
      },
    );

    afterAll(
      async () => {
        await app.close();
      },
    );

    it(
      'removes the client-driven marketplace registration endpoint',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/plugin-marketplace',
          )
          .send({
            plugin: {
              id:
                'attacker-plugin',
              verified:
                true,
              status:
                'AVAILABLE',
            },
          })
          .expect(404);
      },
    );

    it(
      'lists only governance-approved publication records',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/plugin-marketplace',
            )
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);
        expect(
          response.body.data,
        ).toHaveLength(1);

        const plugin =
          response.body.data[0];

        expect(plugin).toEqual(
          expect.objectContaining({
            id:
              'visitor',
            latestVersion:
              '1.1.0',
            provider:
              'propertyos',
            status:
              'AVAILABLE',
            verified:
              true,
            category:
              'Visitor',
            tags: [
              'visitor',
              'security',
            ],
          }),
        );

        expect(
          plugin.versions.map(
            (
              version: {
                version: string;
              },
            ) =>
              version.version,
          ),
        ).toEqual([
          '1.1.0',
          '1.0.0',
        ]);

        expect(
          plugin.versions[0],
        ).toEqual(
          expect.objectContaining({
            checksum:
              'c'.repeat(64),
            integrityChecksum:
              'd'.repeat(64),
            publisherKeyId:
              'release-2026',
          }),
        );
      },
    );

    it(
      'gets an approved marketplace plugin',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/plugin-marketplace/visitor',
            )
            .expect(200);

        expect(
          response.body.data.id,
        ).toBe(
          'visitor',
        );
      },
    );

    it(
      'searches approved records by query, category, and tag',
      async () => {
        for (
          const query of [
            {
              query:
                'visitor',
            },
            {
              category:
                'Visitor',
            },
            {
              tag:
                'security',
            },
          ]
        ) {
          const response =
            await request(
              app.getHttpServer(),
            )
              .post(
                '/api/v1/plugin-marketplace/search',
              )
              .send(query)
              .expect(201);

          expect(
            response.body.data.total,
          ).toBe(1);
          expect(
            response.body.data
              .items[0].id,
          ).toBe(
            'visitor',
          );
        }
      },
    );
  },
);

function publication(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      '11111111-1111-4111-8111-111111111111',
    pluginId:
      'visitor',
    pluginName:
      'Visitor',
    version:
      '1.0.0',
    publisherId:
      'propertyos',
    keyId:
      'release-2026',
    artifactStorageObjectId:
      '33333333-3333-4333-8333-333333333333',
    artifactSha256:
      'a'.repeat(64),
    integritySha256:
      'b'.repeat(64),
    status:
      'APPROVED',
    submittedBy:
      'submitter',
    submittedAt:
      new Date(
        '2026-07-19T00:00:00.000Z',
      ),
    reviewedBy:
      'reviewer',
    reviewedAt:
      new Date(
        '2026-07-19T01:00:00.000Z',
      ),
    metadata: {},
    updatedAt:
      new Date(
        '2026-07-19T01:00:00.000Z',
      ),
    ...normalizeOverrides(
      overrides,
    ),
  };
}

function normalizeOverrides(
  overrides:
    Record<string, unknown>,
) {
  const mapped = {
    ...overrides,
  };

  const aliases: Record<
    string,
    string
  > = {
    artifact_storage_object_id:
      'artifactStorageObjectId',
    artifact_sha256:
      'artifactSha256',
    integrity_sha256:
      'integritySha256',
  };

  for (
    const [
      source,
      target,
    ] of Object.entries(
      aliases,
    )
  ) {
    if (
      source in mapped
    ) {
      mapped[target] =
        mapped[source];
      delete mapped[source];
    }
  }

  return mapped;
}
