import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  createHash,
  generateKeyPairSync,
} from 'crypto';
import {
  canonicalizePluginPublicKey,
} from './plugin-public-key-policy';

describe(
  'canonicalizePluginPublicKey',
  () => {
    it(
      'canonicalizes an RSA key and derives its SPKI fingerprint',
      () => {
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

        const input =
          publicKey.export({
            type:
              'spki',
            format:
              'pem',
          });

        const result =
          canonicalizePluginPublicKey(
            String(input),
          );

        const expectedFingerprint =
          createHash('sha256')
            .update(
              publicKey.export({
                type:
                  'spki',
                format:
                  'der',
              }),
            )
            .digest('hex');

        expect(result).toEqual({
          algorithm:
            'RSA-SHA256',
          publicKeyPem:
            publicKey.export({
              type:
                'spki',
              format:
                'pem',
            }),
          fingerprintSha256:
            expectedFingerprint,
          modulusLength:
            2048,
        });
      },
    );

    it(
      'produces the same identity for equivalent PEM encodings',
      () => {
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

        const spki =
          String(
            publicKey.export({
              type:
                'spki',
              format:
                'pem',
            }),
          );

        const pkcs1 =
          String(
            publicKey.export({
              type:
                'pkcs1',
              format:
                'pem',
            }),
          );

        expect(
          canonicalizePluginPublicKey(
            spki,
          ).fingerprintSha256,
        ).toBe(
          canonicalizePluginPublicKey(
            pkcs1,
          ).fingerprintSha256,
        );
      },
    );

    it(
      'rejects an elliptic-curve key',
      () => {
        const {
          publicKey,
        } =
          generateKeyPairSync(
            'ec',
            {
              namedCurve:
                'prime256v1',
            },
          );

        expect(
          () =>
            canonicalizePluginPublicKey(
              String(
                publicKey.export({
                  type:
                    'spki',
                  format:
                    'pem',
                }),
              ),
            ),
        ).toThrow(
          'PLUGIN_PUBLISHER_PUBLIC_KEY_RSA_REQUIRED',
        );
      },
    );

    it(
      'rejects an RSA key below 2048 bits',
      () => {
        const {
          publicKey,
        } =
          generateKeyPairSync(
            'rsa',
            {
              modulusLength:
                1024,
            },
          );

        expect(
          () =>
            canonicalizePluginPublicKey(
              String(
                publicKey.export({
                  type:
                    'spki',
                  format:
                    'pem',
                }),
              ),
            ),
        ).toThrow(
          'PLUGIN_PUBLISHER_PUBLIC_KEY_TOO_WEAK',
        );
      },
    );

    it.each([
      '',
      'not a public key',
      '-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----',
    ])(
      'rejects malformed public key material',
      (value) => {
        expect(
          () =>
            canonicalizePluginPublicKey(
              value,
            ),
        ).toThrow(
          'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
        );
      },
    );
  },
);
