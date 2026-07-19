import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';

const PUBLICATION_ID =
  '11111111-1111-4111-8111-111111111111';
const STORAGE_ID =
  '22222222-2222-4222-8222-222222222222';

describe(
  'PluginPublicationGovernanceService',
  () => {
    it(
      'submits atomically and records a security event',
      async () => {
        let generatedPublicationId:
          string | undefined;
        let insertCount = 0;

        const client = {
          query:
            jest.fn(
              async (
                text: string,
                values?: unknown[],
              ) => {
                if (
                  text.includes(
                    'INSERT INTO plugin_publications',
                  )
                ) {
                  insertCount += 1;
                  generatedPublicationId =
                    String(
                      values?.[0],
                    );

                  return {
                    rows: [
                      publicationRow({
                        id:
                          generatedPublicationId,
                      }),
                    ],
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

        const service =
          createService(client);

        const result =
          await service.submit(
            validSubmission(),
          );

        expect(
          generatedPublicationId,
        ).toMatch(
          /^[a-f0-9-]{36}$/,
        );

        expect(result).toEqual(
          expect.objectContaining({
            id:
              generatedPublicationId,
            status:
              'SUBMITTED',
            pluginId:
              'visitor',
            version:
              '1.0.0',
          }),
        );

        expect(insertCount).toBe(1);

        expect(
          client.query,
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            'plugin_publication_security_events',
          ),
          expect.arrayContaining([
            expect.any(String),
            generatedPublicationId,
            'SUBMITTED',
            null,
            'SUBMITTED',
            'person-1',
          ]),
        );

        expect(
          queryTexts(client),
        ).toEqual(
          expect.arrayContaining([
            'BEGIN',
            'COMMIT',
          ]),
        );

        expect(
          client.release,
        ).toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate plugin versions as immutable',
      async () => {
        const duplicate =
          Object.assign(
            new Error(
              'duplicate key',
            ),
            {
              code:
                '23505',
            },
          );

        const client = {
          query:
            jest.fn(
              async (
                text: string,
                _values?: unknown[],
              ) => {
                if (
                  text.includes(
                    'INSERT INTO plugin_publications',
                  )
                ) {
                  throw duplicate;
                }

                return {
                  rows: [],
                };
              },
            ),
          release:
            jest.fn(),
        };

        const service =
          createService(client);

        await expect(
          service.submit(
            validSubmission(),
          ),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          queryTexts(client),
        ).toContain(
          'ROLLBACK',
        );
      },
    );

    it(
      'rejects inactive publisher keys',
      async () => {
        const client = {
          query:
            jest.fn(
              async () => ({
                rows: [],
              }),
            ),
          release:
            jest.fn(),
        };

        const service =
          createService(client);

        await expect(
          service.submit(
            validSubmission(),
          ),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_PUBLISHER_KEY_NOT_ACTIVE',
        );

        expect(
          queryTexts(client),
        ).toContain(
          'ROLLBACK',
        );
      },
    );

    it(
      'approves a submitted publication and records the actor',
      async () => {
        const client = {
          query:
            jest.fn(
              async (
                text: string,
                _values?: unknown[],
              ) => {
                if (
                  text.includes(
                    'FOR UPDATE',
                  )
                ) {
                  return {
                    rows: [
                      publicationRow(),
                    ],
                  };
                }

                if (
                  text.includes(
                    'AS eligible',
                  )
                ) {
                  return {
                    rows: [
                      {
                        eligible:
                          true,
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
                      publicationRow({
                        status:
                          'APPROVED',
                        reviewed_by:
                          'reviewer-1',
                        decision_reason:
                          'Security review passed',
                      }),
                    ],
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

        const service =
          createService(client);

        const result =
          await service.transition({
            publicationId:
              PUBLICATION_ID,
            targetStatus:
              'APPROVED',
            actorId:
              'reviewer-1',
            reason:
              'Security review passed',
          });

        expect(result.status).toBe(
          'APPROVED',
        );

        expect(
          client.query,
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            'plugin_publication_security_events',
          ),
          expect.arrayContaining([
            expect.any(String),
            PUBLICATION_ID,
            'APPROVED',
            'SUBMITTED',
            'APPROVED',
            'reviewer-1',
            'Security review passed',
          ]),
        );
      },
    );

    it(
      'forbids submitters from approving their own publication',
      async () => {
        const client = {
          query:
            jest.fn(
              async (
                text: string,
                _values?: unknown[],
              ) => {
                if (
                  text.includes(
                    'FOR UPDATE',
                  )
                ) {
                  return {
                    rows: [
                      publicationRow({
                        submitted_by:
                          'submitter-1',
                      }),
                    ],
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

        const service =
          createService(client);

        await expect(
          service.transition({
            publicationId:
              PUBLICATION_ID,
            targetStatus:
              'APPROVED',
            actorId:
              'submitter-1',
            reason:
              'Self approval attempt',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_SELF_APPROVAL_FORBIDDEN',
        );

        expect(
          queryTexts(client),
        ).toContain(
          'ROLLBACK',
        );
        expect(
          queryTexts(client).some(
            (query) =>
              query.includes(
                'UPDATE plugin_publications',
              ),
          ),
        ).toBe(false);
      },
    );

    it(
      'blocks approval when the publisher key was revoked after submission',
      async () => {
        const client = {
          query:
            jest.fn(
              async (
                text: string,
                _values?: unknown[],
              ) => {
                if (
                  text.includes(
                    'FOR UPDATE',
                  )
                ) {
                  return {
                    rows: [
                      publicationRow(),
                    ],
                  };
                }

                if (
                  text.includes(
                    'AS eligible',
                  )
                ) {
                  return {
                    rows: [
                      {
                        eligible:
                          false,
                      },
                    ],
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

        const service =
          createService(client);

        await expect(
          service.transition({
            publicationId:
              PUBLICATION_ID,
            targetStatus:
              'APPROVED',
            actorId:
              'reviewer-1',
            reason:
              'Approval after revocation',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_PUBLISHER_KEY_NOT_ACTIVE',
        );

        expect(
          queryTexts(client),
        ).toContain(
          'ROLLBACK',
        );
      },
    );

    it(
      'supports quarantine and controlled release',
      async () => {
        const quarantinedClient =
          transitionClient(
            'APPROVED',
            'QUARANTINED',
          );
        const quarantined =
          await createService(
            quarantinedClient,
          ).transition({
            publicationId:
              PUBLICATION_ID,
            targetStatus:
              'QUARANTINED',
            actorId:
              'security-1',
            reason:
              'Incident investigation',
          });

        expect(
          quarantined.status,
        ).toBe(
          'QUARANTINED',
        );

        const releaseClient =
          transitionClient(
            'QUARANTINED',
            'APPROVED',
          );

        await createService(
          releaseClient,
        ).transition({
          publicationId:
            PUBLICATION_ID,
          targetStatus:
            'APPROVED',
          actorId:
            'security-2',
          reason:
            'Investigation cleared',
        });

        expect(
          releaseClient.query,
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            'plugin_publication_security_events',
          ),
          expect.arrayContaining([
            expect.any(String),
            PUBLICATION_ID,
            'QUARANTINE_RELEASED',
            'QUARANTINED',
            'APPROVED',
          ]),
        );
      },
    );

    it(
      'makes revocation terminal',
      async () => {
        const client =
          transitionClient(
            'REVOKED',
            'APPROVED',
          );
        const service =
          createService(client);

        await expect(
          service.transition({
            publicationId:
              PUBLICATION_ID,
            targetStatus:
              'APPROVED',
            actorId:
              'security-1',
            reason:
              'Attempted recovery',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_TRANSITION_INVALID:REVOKED->APPROVED',
        );

        expect(
          queryTexts(client),
        ).toContain(
          'ROLLBACK',
        );
      },
    );

    it(
      'lists only approved discoverable publications',
      async () => {
        const pool = {
          query:
            jest.fn(
              async (
                text: string,
                _values?: unknown[],
              ) => {
                expect(text).toContain(
                  "status = 'APPROVED'",
                );
                expect(text).toContain(
                  'quarantined_at IS NULL',
                );
                expect(text).toContain(
                  'revoked_at IS NULL',
                );

                return {
                  rows: [
                    publicationRow({
                      status:
                        'APPROVED',
                    }),
                  ],
                };
              },
            ),
        } as unknown as Pool;

        const service =
          new PluginPublicationGovernanceService(
            pool,
          );

        await expect(
          service.listApproved(),
        ).resolves.toEqual([
          expect.objectContaining({
            status:
              'APPROVED',
          }),
        ]);
      },
    );

    it(
      'rejects invalid submission metadata before connecting',
      async () => {
        const pool = {
          connect:
            jest.fn(),
        } as unknown as Pool;

        const service =
          new PluginPublicationGovernanceService(
            pool,
          );

        await expect(
          service.submit({
            ...validSubmission(),
            artifactSha256:
              'not-a-checksum',
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

function createService(
  client: {
    query: jest.Mock;
    release: jest.Mock;
  },
): PluginPublicationGovernanceService {
  const pool = {
    connect:
      jest.fn(
        async () =>
          client,
      ),
  } as unknown as Pool;

  return new PluginPublicationGovernanceService(
    pool,
  );
}

function validSubmission() {
  return {
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
      STORAGE_ID,
    artifactSha256:
      'a'.repeat(64),
    integritySha256:
      'b'.repeat(64),
    actorId:
      'person-1',
  };
}

function publicationRow(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      PUBLICATION_ID,
    plugin_id:
      'visitor',
    plugin_name:
      'Visitor',
    version:
      '1.0.0',
    publisher_id:
      'propertyos',
    key_id:
      'release-2026',
    artifact_storage_object_id:
      STORAGE_ID,
    artifact_sha256:
      'a'.repeat(64),
    integrity_sha256:
      'b'.repeat(64),
    status:
      'SUBMITTED',
    submitted_by:
      'person-1',
    submitted_at:
      new Date(
        '2026-07-19T00:00:00.000Z',
      ),
    reviewed_by:
      null,
    reviewed_at:
      null,
    decision_reason:
      null,
    quarantined_by:
      null,
    quarantined_at:
      null,
    quarantine_reason:
      null,
    revoked_by:
      null,
    revoked_at:
      null,
    revocation_reason:
      null,
    metadata: {},
    updated_at:
      new Date(
        '2026-07-19T00:00:00.000Z',
      ),
    ...overrides,
  };
}

function transitionClient(
  current:
    'APPROVED' |
    'QUARANTINED' |
    'REVOKED',
  target:
    'APPROVED' |
    'QUARANTINED',
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
              'FOR UPDATE',
            )
          ) {
            return {
              rows: [
                publicationRow({
                  status:
                    current,
                }),
              ],
            };
          }

          if (
            text.includes(
              'AS eligible',
            )
          ) {
            return {
              rows: [
                {
                  eligible:
                    true,
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
                publicationRow({
                  status:
                    target,
                }),
              ],
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

function queryTexts(
  client: {
    query: jest.Mock;
  },
): string[] {
  return client.query.mock.calls.map(
    (call) =>
      String(call[0]).trim(),
  );
}
