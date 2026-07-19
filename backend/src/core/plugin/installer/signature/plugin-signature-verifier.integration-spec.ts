import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  createHash,
  generateKeyPairSync,
  sign,
} from 'crypto';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import {
  tmpdir,
} from 'os';
import {
  dirname,
  join,
} from 'path';
import {
  PluginPublisherTrustService,
} from '../../trust/plugin-publisher-trust.service';
import {
  PluginSignatureVerifierService,
} from './plugin-signature-verifier.service';

interface IntegrityEntry {
  path: string;
  sha256: string;
  size: number;
}

describe(
  'PluginSignatureVerifierService',
  () => {
    let workspace: string;
    let pluginRoot: string;
    let publicKeyPem: string;
    let privateKeyPem: string;
    let fingerprint: string;
    let trusted: boolean;
    let verifier:
      PluginSignatureVerifierService;

    beforeEach(() => {
      workspace =
        mkdtempSync(
          join(
            tmpdir(),
            'propertyos-signature-',
          ),
        );
      pluginRoot =
        join(
          workspace,
          'plugin',
        );
      mkdirSync(
        pluginRoot,
        {
          recursive: true,
        },
      );

      const keyPair =
        generateKeyPairSync(
          'rsa',
          {
            modulusLength: 2048,
            publicKeyEncoding: {
              type: 'spki',
              format: 'pem',
            },
            privateKeyEncoding: {
              type: 'pkcs8',
              format: 'pem',
            },
          },
        );

      publicKeyPem =
        keyPair.publicKey;
      privateKeyPem =
        keyPair.privateKey;
      fingerprint =
        createHash('sha256')
          .update(
            Buffer.from(
              generatePublicDer(
                publicKeyPem,
              ),
            ),
          )
          .digest('hex');
      trusted = true;

      const trustService = {
        resolveActiveKey:
          async (
            publisherId: string,
            keyId: string,
            algorithm: string,
          ) => {
            if (
              !trusted ||
              publisherId !==
                'propertyos' ||
              keyId !==
                'release-2026' ||
              algorithm !==
                'RSA-SHA256'
            ) {
              return null;
            }

            return {
              publisherId:
                'propertyos',
              publisherName:
                'PropertyOS',
              keyId:
                'release-2026',
              algorithm:
                'RSA-SHA256',
              publicKeyPem,
              fingerprintSha256:
                fingerprint,
              validFrom:
                new Date(
                  '2026-01-01T00:00:00.000Z',
                ),
            };
          },
      } as unknown as
        PluginPublisherTrustService;

      verifier =
        new PluginSignatureVerifierService(
          trustService,
        );

      writePackageFile(
        'plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          name: 'test-plugin',
          version: '1.0.0',
          provider: 'propertyos',
        }),
      );
      writePackageFile(
        'dist/index.js',
        'module.exports = {};',
      );
    });

    afterEach(() => {
      rmSync(
        workspace,
        {
          recursive: true,
          force: true,
        },
      );
    });

    it(
      'accepts a complete package signed by an active trusted key',
      async () => {
        signPackage();

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([]);
      },
    );

    it(
      'rejects an unsigned package',
      async () => {
        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([
          'plugin.integrity.json is required',
          'plugin.signature is required',
        ]);
      },
    );

    it(
      'rejects a modified signed file',
      async () => {
        signPackage();
        writePackageFile(
          'dist/index.js',
          'module.exports = { tampered: true };',
        );

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toContain(
          'Signed plugin file checksum mismatch: dist/index.js',
        );
      },
    );

    it(
      'rejects an unsigned extra file',
      async () => {
        signPackage();
        writePackageFile(
          'dist/extra.js',
          'unexpected',
        );

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toContain(
          'Unsigned plugin file is present: dist/extra.js',
        );
      },
    );

    it(
      'rejects a missing signed file',
      async () => {
        signPackage();
        unlinkSync(
          join(
            pluginRoot,
            'dist/index.js',
          ),
        );

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toContain(
          'Signed plugin file is missing: dist/index.js',
        );
      },
    );

    it(
      'rejects an untrusted publisher key',
      async () => {
        signPackage();
        trusted = false;

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([
          'Plugin publisher key is not trusted or active: propertyos/release-2026',
        ]);
      },
    );

    it(
      'rejects a detached signature over different integrity bytes',
      async () => {
        signPackage();
        const integrityPath =
          join(
            pluginRoot,
            'plugin.integrity.json',
          );
        const value =
          JSON.parse(
            require('fs')
              .readFileSync(
                integrityPath,
                'utf8',
              ),
          );
        value.keyId =
          'another-key';
        writeFileSync(
          integrityPath,
          JSON.stringify(value),
        );

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([
          'Plugin publisher key is not trusted or active: propertyos/another-key',
        ]);
      },
    );

    it(
      'rejects a bundle-supplied public key',
      async () => {
        signPackage();
        writePackageFile(
          'signature.public.pem',
          publicKeyPem,
        );

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([
          'signature.public.pem is forbidden; publisher keys must come from the trusted key registry',
        ]);
      },
    );

    it(
      'rejects a trusted-key fingerprint mismatch',
      async () => {
        signPackage();
        fingerprint =
          '0'.repeat(64);

        await expect(
          verifier.verify(
            pluginRoot,
          ),
        ).resolves.toEqual([
          'Trusted publisher key fingerprint does not match its registry record',
        ]);
      },
    );

    function writePackageFile(
      relativePath: string,
      contents:
        string | Buffer,
    ): void {
      const path =
        join(
          pluginRoot,
          ...relativePath.split('/'),
        );

      mkdirSync(
        dirname(path),
        {
          recursive: true,
        },
      );
      writeFileSync(
        path,
        contents,
      );
    }

    function signPackage(): void {
      const paths = [
        'dist/index.js',
        'plugin.json',
      ];
      const files:
        IntegrityEntry[] =
        paths.map(
          (path) => {
            const data =
              require('fs')
                .readFileSync(
                  join(
                    pluginRoot,
                    ...path.split('/'),
                  ),
                );

            return {
              path,
              sha256:
                createHash('sha256')
                  .update(data)
                  .digest('hex'),
              size:
                data.length,
            };
          },
        );

      const integrityBytes =
        Buffer.from(
          JSON.stringify({
            schemaVersion: 1,
            publisherId:
              'propertyos',
            keyId:
              'release-2026',
            algorithm:
              'RSA-SHA256',
            files,
          }),
        );

      writePackageFile(
        'plugin.integrity.json',
        integrityBytes,
      );
      writePackageFile(
        'plugin.signature',
        sign(
          'RSA-SHA256',
          integrityBytes,
          privateKeyPem,
        ),
      );
    }
  },
);

function generatePublicDer(
  publicKeyPem: string,
): Buffer {
  const {
    createPublicKey,
  } = require('crypto');

  return createPublicKey(
    publicKeyPem,
  ).export({
    type: 'spki',
    format: 'der',
  });
}
