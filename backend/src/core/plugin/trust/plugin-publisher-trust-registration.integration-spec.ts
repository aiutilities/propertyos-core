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
  generateKeyPairSync,
} from 'crypto';
import {
  Pool,
} from 'pg';
import {
  PluginPublisherTrustLifecycleService,
} from './plugin-publisher-trust-lifecycle.service';

describe(
  'PluginPublisherTrustLifecycleService registration',
  () => {
    it(
      'registers a publisher and its audit event atomically',
      async () => {
        const client = createClient(
          async (
            text: string,
          ) => {
            if (
              text.includes(
                'INSERT INTO plugin_publishers',
              )
            ) {
              return {
                rows: [
                  {
                    id:
                      'propertyos',
                    display_name:
                      'PropertyOS',
                    status:
                      'ACTIVE',
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
          await service.registerPublisher({
            publisherId:
              'propertyos',
            displayName:
              'PropertyOS',
            actorId:
              'security-person-1',
          });

        expect(result).toEqual({
          publisherId:
            'propertyos',
          displayName:
            'PropertyOS',
          status:
            'ACTIVE',
        });

        expect(
          callsContaining(
            client,
            'PUBLISHER_REGISTERED',
          ),
        ).toHaveLength(1);

        expect(
          queryTexts(client),
        ).toEqual(
          expect.arrayContaining([
            'BEGIN',
            'COMMIT',
          ]),
        );
      },
    );

    it(
      'registers a canonical public key without accepting a fingerprint',
      async () => {
        const publicKeyPem =
          generatePublicKey();

        const client = createClient(
          async (
            text: string,
            values?: unknown[],
          ) => {
            if (
              text.includes(
                'INSERT INTO plugin_publisher_keys',
              )
            ) {
              return {
                rows: [
                  {
                    key_id:
                      'release-2027',
                    publisher_id:
                      'propertyos',
                    algorithm:
                      values?.[2],
                    public_key_pem:
                      values?.[3],
                    fingerprint_sha256:
                      values?.[4],
                    status:
                      'ACTIVE',
                    valid_from:
                      new Date(
                        '2027-01-01T00:00:00.000Z',
                      ),
                    valid_until:
                      null,
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
          await service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem,
            actorId:
              'security-person-1',
            validFrom:
              new Date(
                '2027-01-01T00:00:00.000Z',
              ),
            metadata: {
              fingerprintSha256:
                'attacker-controlled',
            },
          });

        expect(
          result.fingerprintSha256,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );

        expect(
          result.fingerprintSha256,
        ).not.toBe(
          'attacker-controlled',
        );

        expect(
          result.publicKeyPem,
        ).toContain(
          'BEGIN PUBLIC KEY',
        );

        const eventCall =
          callsContaining(
            client,
            'KEY_REGISTERED',
          )[0];

        const metadata =
          JSON.parse(
            String(
              eventCall[1]?.[4],
            ),
          );

        expect(
          metadata.fingerprintSha256,
        ).toBe(
          result.fingerprintSha256,
        );

        expect(
          metadata.modulusLength,
        ).toBe(2048);
      },
    );

    it(
      'rejects valid private-key material before connecting',
      async () => {
        const {
          privateKey,
        } =
          generateKeyPairSync(
            'rsa',
            {
              modulusLength:
                2048,
            },
          );

        const pool = {
          connect:
            jest.fn(),
        };

        const service =
          new PluginPublisherTrustLifecycleService(
            pool as unknown as Pool,
          );

        await expect(
          service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem:
              String(
                privateKey.export({
                  type:
                    'pkcs8',
                  format:
                    'pem',
                }),
              ),
            actorId:
              'security-person-1',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLISHER_PRIVATE_KEY_FORBIDDEN',
        );

        expect(
          pool.connect,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects private-key fields nested in trust metadata',
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
          service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem:
              generatePublicKey(),
            actorId:
              'security-person-1',
            metadata: {
              incident: {
                private_key:
                  'credential material',
              },
            },
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLISHER_TRUST_SENSITIVE_METADATA_FORBIDDEN',
        );

        expect(
          pool.connect,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects malformed key material before connecting',
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
          service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem:
              'not a public key',
            actorId:
              'security-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          pool.connect,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate publisher identity',
      async () => {
        const duplicate =
          Object.assign(
            new Error(
              'duplicate',
            ),
            {
              code:
                '23505',
            },
          );

        const client = createClient(
          async (
            text: string,
          ) => {
            if (
              text.includes(
                'INSERT INTO plugin_publishers',
              )
            ) {
              throw duplicate;
            }

            return {
              rows: [],
            };
          },
        );

        const service =
          createService(client);

        await expect(
          service.registerPublisher({
            publisherId:
              'propertyos',
            displayName:
              'PropertyOS',
            actorId:
              'security-person-1',
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
      'rejects registration against an inactive publisher',
      async () => {
        const client = createClient(
          async () => ({
            rows: [],
          }),
        );

        const service =
          createService(client);

        await expect(
          service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem:
              generatePublicKey(),
            actorId:
              'security-person-1',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLISHER_NOT_ACTIVE',
        );

        expect(
          queryTexts(client),
        ).toContain('ROLLBACK');
      },
    );

    it(
      'rejects an invalid key validity window before connecting',
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
          service.registerKey({
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            publicKeyPem:
              generatePublicKey(),
            actorId:
              'security-person-1',
            validFrom:
              new Date(
                '2027-02-01T00:00:00.000Z',
              ),
            validUntil:
              new Date(
                '2027-01-01T00:00:00.000Z',
              ),
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

function generatePublicKey(): string {
  const {
    publicKey,
  } =
    generateKeyPairSync(
      'rsa',
      {
        modulusLength:
          2048,
      },
    );

  return String(
    publicKey.export({
      type:
        'spki',
      format:
        'pem',
    }),
  );
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
