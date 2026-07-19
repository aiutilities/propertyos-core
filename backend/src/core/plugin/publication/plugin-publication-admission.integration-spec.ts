import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
} from '@nestjs/common';
import {
  createHash,
} from 'crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {
  tmpdir,
} from 'os';
import {
  join,
} from 'path';
import {
  PluginPublicationAdmissionService,
} from './plugin-publication-admission.service';

const STORAGE_ID =
  '22222222-2222-4222-8222-222222222222';

describe(
  'PluginPublicationAdmissionService',
  () => {
    let workspace: string;
    let originalWorkingDirectory:
      string;
    let extractedPath: string;
    let pluginRoot: string;
    let content: Buffer;
    let checksum: string;
    let integrityBytes: Buffer;

    beforeEach(() => {
      originalWorkingDirectory =
        process.cwd();
      workspace =
        mkdtempSync(
          join(
            tmpdir(),
            'propertyos-publication-',
          ),
        );
      process.chdir(
        workspace,
      );

      extractedPath =
        join(
          workspace,
          'extracted',
        );
      pluginRoot =
        join(
          extractedPath,
          'plugin',
        );
      mkdirSync(
        pluginRoot,
        {
          recursive: true,
        },
      );

      integrityBytes =
        Buffer.from(
          JSON.stringify({
            schemaVersion: 1,
            publisherId:
              'propertyos',
            keyId:
              'release-2026',
            algorithm:
              'RSA-SHA256',
            files: [],
          }),
        );
      writeFileSync(
        join(
          pluginRoot,
          'plugin.integrity.json',
        ),
        integrityBytes,
      );

      content =
        Buffer.from(
          'signed-plugin-archive',
        );
      checksum =
        createHash('sha256')
          .update(content)
          .digest('hex');
    });

    afterEach(() => {
      process.chdir(
        originalWorkingDirectory,
      );
      rmSync(
        workspace,
        {
          recursive: true,
          force: true,
        },
      );
    });

    it(
      'derives immutable publication evidence from a verified stored artifact',
      async () => {
        const governance = {
          submit:
            jest.fn(
              async (
                input: unknown,
              ) => input,
            ),
        };
        const {
          service,
        } = createService({
          governance,
        });

        const result =
          await service.admit({
            storageObjectId:
              STORAGE_ID,
            actorId:
              'person-1',
            metadata: {
              channel:
                'stable',
            },
          });

        expect(
          governance.submit,
        ).toHaveBeenCalledWith({
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
            checksum,
          integritySha256:
            createHash('sha256')
              .update(
                integrityBytes,
              )
              .digest('hex'),
          actorId:
            'person-1',
          metadata: {
            channel:
              'stable',
          },
        });

        expect(result).toEqual(
          expect.objectContaining({
            pluginId:
              'visitor',
            publisherId:
              'propertyos',
          }),
        );

        expect(
          existsSync(
            extractedPath,
          ),
        ).toBe(false);
        expect(
          publicationIntakeFiles(),
        ).toEqual([]);
      },
    );

    it(
      'rejects stored content checksum drift before extraction',
      async () => {
        const extractor = {
          extract:
            jest.fn(),
        };
        const {
          service,
        } = createService({
          extractor,
          storageObject: {
            checksum:
              'f'.repeat(64),
          },
        });

        await expect(
          service.admit({
            storageObjectId:
              STORAGE_ID,
            actorId:
              'person-1',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_ARTIFACT_CHECKSUM_MISMATCH',
        );

        expect(
          extractor.extract,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects signature failure and cleans all temporary files',
      async () => {
        const governance = {
          submit:
            jest.fn(),
        };
        const {
          service,
        } = createService({
          governance,
          signatureVerifier: {
            verify:
              jest.fn(
                async () => [
                  'Plugin digital signature verification failed',
                ],
              ),
          },
        });

        await expect(
          service.admit({
            storageObjectId:
              STORAGE_ID,
            actorId:
              'person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          governance.submit,
        ).not.toHaveBeenCalled();
        expect(
          existsSync(
            extractedPath,
          ),
        ).toBe(false);
        expect(
          publicationIntakeFiles(),
        ).toEqual([]);
      },
    );

    it(
      'rejects a manifest publisher that differs from the signed publisher',
      async () => {
        const governance = {
          submit:
            jest.fn(),
        };
        const {
          service,
        } = createService({
          governance,
          manifestService: {
            discover:
              jest.fn(
                () => ({
                  id:
                    'visitor',
                  name:
                    'Visitor',
                  version:
                    '1.0.0',
                  provider:
                    'attacker',
                }),
              ),
          },
        });

        await expect(
          service.admit({
            storageObjectId:
              STORAGE_ID,
            actorId:
              'person-1',
          }),
        ).rejects.toThrow(
          'PLUGIN_PUBLICATION_PUBLISHER_MISMATCH',
        );

        expect(
          governance.submit,
        ).not.toHaveBeenCalled();
      },
    );

    function createService(
      overrides:
        Record<string, any> = {},
    ) {
      const storageObject = {
        id:
          STORAGE_ID,
        originalName:
          'visitor.zip',
        mimeType:
          'application/zip',
        sizeBytes:
          content.length,
        checksum,
        entityType:
          'PLUGIN_PACKAGE',
        metadata: {
          purpose:
            'plugin-publication',
        },
        ...(
          overrides.storageObject ??
          {}
        ),
      };
      const storage = {
        getObject:
          jest.fn(
            async () =>
              storageObject,
          ),
        getContent:
          jest.fn(
            async () =>
              content,
          ),
      };
      const extractor =
        overrides.extractor ?? {
          extract:
            jest.fn(
              (
                _archivePath:
                  string,
              ) =>
                extractedPath,
            ),
        };
      const discovery =
        overrides.discovery ?? {
          discover:
            jest.fn(
              () =>
                pluginRoot,
            ),
        };
      const manifestService =
        overrides.manifestService ?? {
          discover:
            jest.fn(
              () => ({
                id:
                  'visitor',
                name:
                  'Visitor',
                version:
                  '1.0.0',
                provider:
                  'propertyos',
              }),
            ),
        };
      const signatureVerifier =
        overrides.signatureVerifier ?? {
          verify:
            jest.fn(
              async () => [],
            ),
        };
      const governance =
        overrides.governance ?? {
          submit:
            jest.fn(
              async (
                input: unknown,
              ) => input,
            ),
        };

      return {
        service:
          new PluginPublicationAdmissionService(
            storage as never,
            extractor as never,
            discovery as never,
            manifestService as never,
            signatureVerifier as never,
            governance as never,
          ),
      };
    }

    function publicationIntakeFiles():
      string[] {
      const directory =
        join(
          workspace,
          'plugins',
          '.publication-intake',
        );

      return existsSync(directory)
        ? readdirSync(directory)
        : [];
    }
  },
);
