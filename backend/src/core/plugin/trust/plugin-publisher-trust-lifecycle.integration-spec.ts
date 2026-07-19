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
  'PluginPublisherTrustLifecycleService',
  () => {
    it(
      'revokes a key and quarantines approved publications atomically',
      async () => {
        const client = createClient(
          async (
            text: string,
          ) => {
            if (
              text.includes(
                'SELECT',
              ) &&
              text.includes(
                'plugin_publisher_keys',
              )
            ) {
              return {
                rows: [
                  {
                    key_id:
                      'release-2026',
                    publisher_id:
                      'propertyos',
                    status:
                      'ACTIVE',
                    revoked_at:
                      null,
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
                rows: [
                  {
                    key_id:
                      'release-2026',
                  },
                ],
              };
            }

            if (
              text.includes(
                'UPDATE plugin_publications',
              )
            ) {
              return {
                rows: [
                  {
                    id:
                      '11111111-1111-4111-8111-111111111111',
                  },
                  {
                    id:
                      '22222222-2222-4222-8222-222222222222',
                  },
                ],
              };
            }

            return {
              rows: [],
            };
          },
        );

        const service =
          createService(client);

        const result =
          await service.revokeKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2026',
            actorId:
              'security-person-1',
            reason:
              'Private key compromise',
            metadata: {
              incidentId:
                'incident-42',
            },
          });

        expect(result).toEqual({
          publisherId:
            'propertyos',
          keyId:
            'release-2026',
          status:
            'REVOKED',
          quarantinedPublicationIds: [
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
          ],
          quarantinedPublicationCount:
            2,
        });

        expect(
          queryTexts(client),
        ).toEqual(
          expect.arrayContaining([
            'BEGIN',
            'COMMIT',
          ]),
        );

        expect(
          callsContaining(
            client,
            'plugin_publication_security_events',
          ),
        ).toHaveLength(2);

        expect(
          callsContaining(
            client,
            'plugin_publisher_trust_security_events',
          ),
        ).toHaveLength(1);

        expect(
          client.release,
        ).toHaveBeenCalled();
      },
    );

    it(
      'prevents client metadata from overriding trusted audit evidence',
      async () => {
        const client = createClient(
          successfulQuery([
            {
              id:
                '11111111-1111-4111-8111-111111111111',
            },
          ]),
        );

        const service =
          createService(client);

        await service.revokeKey({
          ...validInput(),
          metadata: {
            source:
              'attacker-controlled',
            publisherId:
              'attacker',
            keyId:
              'attacker-key',
            quarantinedPublicationIds:
              [],
            quarantinedPublicationCount:
              999,
          },
        });

        const publicationCall =
          callsContaining(
            client,
            'plugin_publication_security_events',
          )[0];

        const trustCall =
          callsContaining(
            client,
            'plugin_publisher_trust_security_events',
          )[0];

        const publicationMetadata =
          JSON.parse(
            String(
              publicationCall[1]?.[4],
            ),
          );

        const trustMetadata =
          JSON.parse(
            String(
              trustCall[1]?.[5],
            ),
          );

        expect(
          publicationMetadata,
        ).toEqual(
          expect.objectContaining({
            source:
              'publisher-key-revocation',
            publisherId:
              'propertyos',
            keyId:
              'release-2026',
          }),
        );

        expect(
          trustMetadata,
        ).toEqual(
          expect.objectContaining({
            quarantinedPublicationIds: [
              '11111111-1111-4111-8111-111111111111',
            ],
            quarantinedPublicationCount:
              1,
          }),
        );
      },
    );

    it(
      'records revocation even when no approved publications remain',
      async () => {
        const client = createClient(
          successfulQuery(
            [],
          ),
        );

        const service =
          createService(client);

        const result =
          await service.revokeKey(
            validInput(),
          );

        expect(
          result.quarantinedPublicationCount,
        ).toBe(0);

        expect(
          callsContaining(
            client,
            'plugin_publication_security_events',
          ),
        ).toHaveLength(0);

        expect(
          callsContaining(
            client,
            'plugin_publisher_trust_security_events',
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'rejects an already revoked key and rolls back',
      async () => {
        const client = createClient(
          async (
            text: string,
          ) => {
            if (
              text.includes(
                'SELECT',
              ) &&
              text.includes(
                'plugin_publisher_keys',
              )
            ) {
              return {
                rows: [
                  {
                    key_id:
                      'release-2026',
                    publisher_id:
                      'propertyos',
                    status:
                      'REVOKED',
                    revoked_at:
                      new Date(),
                  },
                ],
              };
            }

            return {
              rows: [],
            };
          },
        );

        const service =
          createService(client);

        await expect(
          service.revokeKey(
            validInput(),
          ),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          queryTexts(client),
        ).toContain('ROLLBACK');

        expect(
          queryTexts(client),
        ).not.toContain('COMMIT');
      },
    );

    it(
      'rejects an unknown key and rolls back',
      async () => {
        const client = createClient(
          async () => ({
            rows: [],
          }),
        );

        const service =
          createService(client);

        await expect(
          service.revokeKey(
            validInput(),
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          queryTexts(client),
        ).toContain('ROLLBACK');
      },
    );

    it.each([
      {
        publisherId:
          '../propertyos',
        keyId:
          'release-2026',
        actorId:
          'security-person-1',
        reason:
          'Compromise',
      },
      {
        publisherId:
          'propertyos',
        keyId:
          '../release',
        actorId:
          'security-person-1',
        reason:
          'Compromise',
      },
      {
        publisherId:
          'propertyos',
        keyId:
          'release-2026',
        actorId:
          '',
        reason:
          'Compromise',
      },
      {
        publisherId:
          'propertyos',
        keyId:
          'release-2026',
        actorId:
          'security-person-1',
        reason:
          '   ',
      },
    ])(
      'rejects invalid input before connecting',
      async (input) => {
        const pool = {
          connect:
            jest.fn(),
        };

        const service =
          new PluginPublisherTrustLifecycleService(
            pool as unknown as Pool,
          );

        await expect(
          service.revokeKey(input),
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

function validInput() {
  return {
    publisherId:
      'propertyos',
    keyId:
      'release-2026',
    actorId:
      'security-person-1',
    reason:
      'Private key compromise',
  };
}

function successfulQuery(
  publicationRows: Array<{
    id: string;
  }>,
) {
  return async (
    text: string,
  ) => {
    if (
      text.includes(
        'SELECT',
      ) &&
      text.includes(
        'plugin_publisher_keys',
      )
    ) {
      return {
        rows: [
          {
            key_id:
              'release-2026',
            publisher_id:
              'propertyos',
            status:
              'ACTIVE',
            revoked_at:
              null,
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
        rows: [
          {
            key_id:
              'release-2026',
          },
        ],
      };
    }

    if (
      text.includes(
        'UPDATE plugin_publications',
      )
    ) {
      return {
        rows:
          publicationRows,
      };
    }

    return {
      rows: [],
    };
  };
}

function createClient(
  implementation:
    (
      text: string,
      values?: unknown[],
    ) => Promise<{
      rows: any[];
    }>,
) {
  return {
    query:
      jest.fn(implementation),
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
