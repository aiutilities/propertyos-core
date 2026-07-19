import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Pool,
} from 'pg';
import {
  PluginPublisherTrustService,
} from './plugin-publisher-trust.service';

describe(
  'PluginPublisherTrustService',
  () => {
    it(
      'returns an active trusted publisher key',
      async () => {
        const pool = {
          query:
            async (
              _text: string,
              values: unknown[],
            ) => {
              expect(values).toEqual([
                'propertyos',
                'propertyos-release-2026',
                'RSA-SHA256',
              ]);

              return {
                rows: [
                  {
                    publisher_id:
                      'propertyos',
                    publisher_name:
                      'PropertyOS',
                    key_id:
                      'propertyos-release-2026',
                    algorithm:
                      'RSA-SHA256',
                    public_key_pem:
                      'PUBLIC KEY',
                    fingerprint_sha256:
                      'a'.repeat(64),
                    valid_from:
                      '2026-01-01T00:00:00.000Z',
                    valid_until:
                      null,
                  },
                ],
              };
            },
        } as unknown as Pool;

        const service =
          new PluginPublisherTrustService(
            pool,
          );

        await expect(
          service.resolveActiveKey(
            'propertyos',
            'propertyos-release-2026',
            'RSA-SHA256',
          ),
        ).resolves.toEqual({
          publisherId:
            'propertyos',
          publisherName:
            'PropertyOS',
          keyId:
            'propertyos-release-2026',
          algorithm:
            'RSA-SHA256',
          publicKeyPem:
            'PUBLIC KEY',
          fingerprintSha256:
            'a'.repeat(64),
          validFrom:
            new Date(
              '2026-01-01T00:00:00.000Z',
            ),
          validUntil:
            undefined,
        });
      },
    );

    it(
      'returns null when the key is not trusted or active',
      async () => {
        const pool = {
          query:
            async () => ({
              rows: [],
            }),
        } as unknown as Pool;

        const service =
          new PluginPublisherTrustService(
            pool,
          );

        await expect(
          service.resolveActiveKey(
            'community-publisher',
            'revoked-key',
            'RSA-SHA256',
          ),
        ).resolves.toBeNull();
      },
    );

    it.each([
      [
        '../publisher',
        'valid-key',
      ],
      [
        'valid-publisher',
        '../../key',
      ],
      [
        '',
        'valid-key',
      ],
    ])(
      'rejects unsafe publisher or key identifiers',
      async (
        publisherId,
        keyId,
      ) => {
        const pool = {
          query:
            async () => {
              throw new Error(
                'Database must not be queried',
              );
            },
        } as unknown as Pool;

        const service =
          new PluginPublisherTrustService(
            pool,
          );

        await expect(
          service.resolveActiveKey(
            publisherId,
            keyId,
            'RSA-SHA256',
          ),
        ).rejects.toThrow(
          /Invalid plugin/,
        );
      },
    );

    it(
      'rejects unsupported signing algorithms',
      async () => {
        const pool = {
          query:
            async () => {
              throw new Error(
                'Database must not be queried',
              );
            },
        } as unknown as Pool;

        const service =
          new PluginPublisherTrustService(
            pool,
          );

        await expect(
          service.resolveActiveKey(
            'propertyos',
            'release-key',
            'ED25519' as never,
          ),
        ).rejects.toThrow(
          'Unsupported plugin signing algorithm',
        );
      },
    );
  },
);
