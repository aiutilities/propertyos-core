import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  PluginPublicationGovernanceService,
} from '../../publication/plugin-publication-governance.service';
import {
  PluginPublication,
} from '../../publication/plugin-publication-governance.types';
import {
  PluginMarketplaceService,
} from './plugin-marketplace.service';

const PUBLICATION_ID =
  '22222222-2222-4222-8222-222222222222';
const ARTIFACT_SHA256 =
  'a'.repeat(64);
const INTEGRITY_SHA256 =
  'b'.repeat(64);

function approvedPublication(
  overrides:
    Partial<PluginPublication> = {},
): PluginPublication {
  return {
    id: PUBLICATION_ID,
    pluginId:
      'propertyos.phase13d4-pilot',
    pluginName:
      'PropertyOS Phase 13D4 Pilot',
    version: '1.0.0',
    publisherId: 'propertyos',
    keyId: 'pilot-key-2026',
    artifactStorageObjectId:
      '11111111-1111-4111-8111-111111111111',
    artifactSha256:
      ARTIFACT_SHA256,
    integritySha256:
      INTEGRITY_SHA256,
    status: 'APPROVED',
    submittedBy:
      'pilot-submitter',
    submittedAt:
      new Date(
        '2026-07-19T18:31:00.000Z',
      ),
    reviewedBy:
      'pilot-approver',
    reviewedAt:
      new Date(
        '2026-07-19T18:32:00.000Z',
      ),
    metadata: {
      description:
        'Controlled deployment pilot',
      category: 'operations',
      tags: [
        'pilot',
        'deployment',
      ],
      minimumPlatformVersion:
        '2.9.0',
      changelog:
        'Initial controlled pilot',
    },
    updatedAt:
      new Date(
        '2026-07-19T18:32:00.000Z',
      ),
    ...overrides,
  };
}

function serviceWith(
  publications:
    PluginPublication[],
) {
  const listApproved =
    jest.fn(
      async () =>
        publications,
    );

  const governance = {
    listApproved,
  } as unknown as
    PluginPublicationGovernanceService;

  return {
    service:
      new PluginMarketplaceService(
        governance,
      ),
    listApproved,
  };
}

describe(
  'Plugin marketplace approved-publication projection',
  () => {
    it(
      'projects approved publication trust evidence',
      async () => {
        const {
          service,
          listApproved,
        } = serviceWith([
          approvedPublication(),
        ]);

        const plugins =
          await service.list();

        expect(listApproved)
          .toHaveBeenCalledTimes(1);

        expect(plugins).toEqual([
          {
            id:
              'propertyos.phase13d4-pilot',
            name:
              'PropertyOS Phase 13D4 Pilot',
            provider: 'propertyos',
            description:
              'Controlled deployment pilot',
            category: 'operations',
            tags: [
              'pilot',
              'deployment',
            ],
            latestVersion: '1.0.0',
            status: 'AVAILABLE',
            verified: true,
            downloads: 0,
            versions: [
              {
                publicationId:
                  PUBLICATION_ID,
                version: '1.0.0',
                releasedAt:
                  new Date(
                    '2026-07-19T18:32:00.000Z',
                  ),
                minimumPlatformVersion:
                  '2.9.0',
                checksum:
                  ARTIFACT_SHA256,
                integrityChecksum:
                  INTEGRITY_SHA256,
                publisherKeyId:
                  'pilot-key-2026',
                artifactStorageObjectId:
                  '11111111-1111-4111-8111-111111111111',
                changelog:
                  'Initial controlled pilot',
              },
            ],
          },
        ]);
      },
    );

    it(
      'removes a publication when governance no longer returns it',
      async () => {
        const listApproved =
          jest.fn<
            PluginPublicationGovernanceService[
              'listApproved'
            ]
          >()
            .mockResolvedValueOnce([
              approvedPublication(),
            ])
            .mockResolvedValueOnce([]);

        const governance = {
          listApproved,
        } as unknown as
          PluginPublicationGovernanceService;

        const service =
          new PluginMarketplaceService(
            governance,
          );

        expect(
          await service.get(
            'propertyos.phase13d4-pilot',
          ),
        ).toBeDefined();

        expect(
          await service.get(
            'propertyos.phase13d4-pilot',
          ),
        ).toBeUndefined();
      },
    );

    it(
      'searches only the approved projection supplied by governance',
      async () => {
        const {
          service,
        } = serviceWith([
          approvedPublication(),
        ]);

        const result =
          await service.search({
            query: 'phase 13d4',
            category:
              'operations',
            tag: 'pilot',
          });

        expect(result.total).toBe(1);
        expect(
          result.items[0]
            .versions[0]
            .publicationId,
        ).toBe(PUBLICATION_ID);

        const missing =
          await service.search({
            query: 'unapproved',
          });

        expect(missing).toEqual({
          total: 0,
          items: [],
        });
      },
    );
  },
);
