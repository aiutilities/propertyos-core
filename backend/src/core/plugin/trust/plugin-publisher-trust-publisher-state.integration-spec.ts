import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';
import {
  PluginPublisherTrustLifecycleService,
} from './plugin-publisher-trust-lifecycle.service';

describe(
  'PluginPublisherTrustLifecycleService publisher state',
  () => {
    it(
      'suspends a publisher and quarantines approved publications',
      async () => {
        const client =
          createClient(
            'ACTIVE',
            [
              '11111111-1111-4111-8111-111111111111',
            ],
            [],
          );

        const service =
          createService(client);

        const result =
          await service.transitionPublisher({
            publisherId:
              'propertyos',
            targetStatus:
              'SUSPENDED',
            actorId:
              'security-person-1',
            reason:
              'Security review',
          });

        expect(result).toEqual({
          publisherId:
            'propertyos',
          fromStatus:
            'ACTIVE',
          status:
            'SUSPENDED',
          quarantinedPublicationIds: [
            '11111111-1111-4111-8111-111111111111',
          ],
          quarantinedPublicationCount:
            1,
          revokedKeyIds: [],
          revokedKeyCount:
            0,
        });

        expect(
          callsContaining(
            client,
            'plugin_publication_security_events',
          ),
        ).toHaveLength(1);

        expect(
          callsWithValue(
            client,
            'PUBLISHER_SUSPENDED',
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'reactivates a suspended publisher without releasing quarantined publications',
      async () => {
        const client =
          createClient(
            'SUSPENDED',
            [],
            [],
          );

        const service =
          createService(client);

        const result =
          await service.transitionPublisher({
            publisherId:
              'propertyos',
            targetStatus:
              'ACTIVE',
            actorId:
              'security-person-1',
            reason:
              'Security review passed',
          });

        expect(
          result.quarantinedPublicationCount,
        ).toBe(0);

        expect(
          callsContaining(
            client,
            'UPDATE plugin_publications',
          ),
        ).toHaveLength(0);

        expect(
          callsWithValue(
            client,
            'PUBLISHER_REACTIVATED',
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'terminally revokes a publisher, keys, and approved publications',
      async () => {
        const client =
          createClient(
            'ACTIVE',
            [
              '11111111-1111-4111-8111-111111111111',
            ],
            [
              'release-2026',
              'release-2027',
            ],
          );

        const service =
          createService(client);

        const result =
          await service.transitionPublisher({
            publisherId:
              'propertyos',
            targetStatus:
              'REVOKED',
            actorId:
              'security-person-1',
            reason:
              'Publisher identity compromise',
          });

        expect(
          result.revokedKeyIds,
        ).toEqual([
          'release-2026',
          'release-2027',
        ]);

        expect(
          result.quarantinedPublicationCount,
        ).toBe(1);

        expect(
          callsWithValue(
            client,
            'PUBLISHER_REVOKED',
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'rejects transitions from a revoked publisher',
      async () => {
        const client =
          createClient(
            'REVOKED',
            [],
            [],
          );

        const service =
          createService(client);

        await expect(
          service.transitionPublisher({
            publisherId:
              'propertyos',
            targetStatus:
              'ACTIVE',
            actorId:
              'security-person-1',
            reason:
              'Attempted reactivation',
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          queryTexts(client),
        ).toContain('ROLLBACK');
      },
    );

    it(
      'rejects an unknown publisher',
      async () => {
        const client =
          createClient(
            undefined,
            [],
            [],
          );

        const service =
          createService(client);

        await expect(
          service.transitionPublisher({
            publisherId:
              'propertyos',
            targetStatus:
              'SUSPENDED',
            actorId:
              'security-person-1',
            reason:
              'Security review',
          }),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'rejects invalid transition input before connecting',
      async () => {
        const pool = {
          connect:
            jest.fn(),
        };

        const service =
          new PluginPublisherTrustLifecycleService(
            pool as unknown as Pool,
          );

        await expect(
          service.transitionPublisher({
            publisherId:
              '../propertyos',
            targetStatus:
              'SUSPENDED',
            actorId:
              'security-person-1',
            reason:
              'Security review',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          pool.connect,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

function createClient(
  currentStatus:
    string | undefined,
  publicationIds:
    string[],
  keyIds:
    string[],
) {
  return {
    query:
      jest.fn(
        async (
          text: string,
          _values?: unknown[],
        ) => {
          if (
            text.includes(
              'SELECT',
            ) &&
            text.includes(
              'FROM plugin_publishers',
            )
          ) {
            return {
              rows:
                currentStatus
                  ? [
                      {
                        id:
                          'propertyos',
                        status:
                          currentStatus,
                        revoked_at:
                          currentStatus ===
                            'REVOKED'
                            ? new Date()
                            : null,
                      },
                    ]
                  : [],
            };
          }

          if (
            text.includes(
              'UPDATE plugin_publishers',
            )
          ) {
            return {
              rows: [
                {
                  id:
                    'propertyos',
                  status:
                    'UPDATED',
                },
              ],
            };
          }

          if (
            text.includes(
              'UPDATE plugin_publisher_keys',
            )
          ) {
            return {
              rows:
                keyIds.map(
                  (keyId) => ({
                    key_id:
                      keyId,
                  }),
                ),
            };
          }

          if (
            text.includes(
              'UPDATE plugin_publications',
            )
          ) {
            return {
              rows:
                publicationIds.map(
                  (id) => ({
                    id,
                  }),
                ),
            };
          }

          return {
            rows: [],
          };
        },
      ),
    release:
      jest.fn(),
  };
}

function createService(
  client: ReturnType<
    typeof createClient
  >,
) {
  const pool = {
    connect:
      jest.fn(
        async () => client,
      ),
  };

  return new PluginPublisherTrustLifecycleService(
    pool as unknown as Pool,
  );
}

function queryTexts(
  client: ReturnType<
    typeof createClient
  >,
): string[] {
  return client.query.mock.calls.map(
    (call) =>
      String(call[0]).trim(),
  );
}

function callsWithValue(
  client: ReturnType<
    typeof createClient
  >,
  expected: unknown,
) {
  return client.query.mock.calls.filter(
    (call) =>
      Array.isArray(
        call[1],
      ) &&
      call[1].includes(
        expected,
      ),
  );
}

function callsContaining(
  client: ReturnType<
    typeof createClient
  >,
  fragment: string,
) {
  return client.query.mock.calls.filter(
    (call) =>
      String(call[0]).includes(
        fragment,
      ),
  );
}
