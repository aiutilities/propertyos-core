import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  createHash,
} from 'crypto';
import {
  existsSync,
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
  PluginInstallationConflictError,
} from '../coordination/plugin-installation-coordinator.service';
import {
  PluginInstallerService,
} from './plugin-installer.service';

describe(
  'PluginInstallerService coordination',
  () => {
    let workspace: string;
    let originalWorkingDirectory: string;

    beforeEach(() => {
      originalWorkingDirectory =
        process.cwd();
      workspace =
        mkdtempSync(
          join(
            tmpdir(),
            'propertyos-installer-coordination-',
          ),
        );
      process.chdir(workspace);
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

    const createService = (
      overrides: Record<string, unknown> = {},
    ) => {
      const extractor =
        overrides.extractor ?? {
          extract:
            jest.fn(
              async () =>
                join(
                  workspace,
                  'extracted-plugin',
                ),
            ),
        };

      const coordinator =
        overrides.coordinator ?? {
          coordinate:
            jest.fn(
              async (
                _requestKey: string,
                operation:
                  () => Promise<unknown>,
              ) => ({
                replayed: false,
                value:
                  await operation(),
              }),
            ),
        };

      const discovery =
        overrides.discovery ?? {
          discover:
            jest.fn(
              (path: string) =>
                path,
            ),
        };

      const rollbackService =
        overrides.rollbackService ?? {
          rollback:
            jest.fn(),
        };

      const validator =
        overrides.validator ?? {
          validate:
            jest.fn(
              async () => [],
            ),
        };

      const dependencyResolver =
        overrides.dependencyResolver ?? {
          validateDependencies:
            jest.fn(
              async () => ({
                valid: true,
                errors: [],
                missing: [],
                installed: [],
              }),
            ),
        };

      const migrationRunner =
        overrides.migrationRunner ?? {
          run:
            jest.fn(
              async () => ({
                executed: [],
                skipped: [],
              }),
            ),
          rollback:
            jest.fn(),
        };

      const manifestService =
        overrides.manifestService ?? {
          discover:
            jest.fn(
              () => ({
                id: 'test-plugin',
                name: 'test-plugin',
                version: '1.0.0',
                provider: 'PropertyOS',
                dependencies: [],
              }),
            ),
          toInstalledManifest:
            jest.fn(
              (
                manifest: {
                  name: string;
                  version: string;
                },
              ) => ({
                name: manifest.name,
                displayName:
                  manifest.name,
                version:
                  manifest.version,
              }),
            ),
          toPackageManifest:
            jest.fn(
              (
                manifest: {
                  name: string;
                  version: string;
                },
              ) =>
                manifest,
            ),
        };

      const pluginPackageService =
        overrides.pluginPackageService ?? {
          register:
            jest.fn(
              () => ({
                id: 'package-1',
                status: 'VALID',
                validationErrors: [],
                validationWarnings: [],
              }),
            ),
        };

      const pluginService =
        overrides.pluginService ?? {
          installedPlugins:
            jest.fn(
              async () => [],
            ),
          install:
            jest.fn(
              async () => ({
                success: true,
                plugin: {
                  id: 'plugin-1',
                },
              }),
            ),
          activate:
            jest.fn(
              async () => ({
                success: true,
              }),
            ),
        };

      const eventBus =
        overrides.eventBus ?? {
          publish:
            jest.fn(
              async () => undefined,
            ),
        };

      const storageService =
        overrides.storageService ?? {
          getContent:
            jest.fn(),
        };

      const service =
        new PluginInstallerService(
          extractor as never,
          coordinator as never,
          discovery as never,
          rollbackService as never,
          validator as never,
          dependencyResolver as never,
          migrationRunner as never,
          manifestService as never,
          pluginPackageService as never,
          pluginService as never,
          eventBus as never,
          storageService as never,
        );

      return {
        service,
        extractor,
        coordinator,
        rollbackService,
        validator,
        migrationRunner,
        pluginService,
        eventBus,
        storageService,
      };
    };

    it(
      'uses the artifact SHA-256 digest and exposes replay evidence',
      async () => {
        const packagePath =
          join(
            workspace,
            'replay.zip',
          );
        const content =
          Buffer.from(
            'deterministic-plugin-artifact',
          );

        writeFileSync(
          packagePath,
          content,
        );

        const expectedRequestKey =
          createHash('sha256')
            .update(content)
            .digest('hex');

        const coordinator = {
          coordinate:
            jest.fn(
              async (
                _requestKey: string,
                _operation:
                  () => Promise<unknown>,
                _succeeded:
                  (value: unknown) =>
                    boolean,
              ) => ({
                replayed: true,
                value: {
                  success: true,
                  stage:
                    'COMPLETE',
                  installedPluginId:
                    'existing-plugin',
                  messages: [
                    'Plugin installed',
                  ],
                },
              }),
            ),
        };

        const {
          service,
        } = createService({
          coordinator,
        });

        await expect(
          service.install({
            packagePath,
          }),
        ).resolves.toEqual({
          success: true,
          stage: 'COMPLETE',
          installedPluginId:
            'existing-plugin',
          requestKey:
            expectedRequestKey,
          replayed: true,
          messages: [
            'Plugin installed',
            'Installation result replayed from completed attempt',
          ],
        });

        expect(
          coordinator.coordinate,
        ).toHaveBeenCalledWith(
          expectedRequestKey,
          expect.any(Function),
          expect.any(Function),
        );
      },
    );

    it(
      'returns a controlled concurrent-installation result',
      async () => {
        const packagePath =
          join(
            workspace,
            'concurrent.zip',
          );

        writeFileSync(
          packagePath,
          'concurrent-artifact',
        );

        const coordinator = {
          coordinate:
            jest.fn(
              async (
                requestKey: string,
              ) => {
                throw new PluginInstallationConflictError(
                  requestKey,
                );
              },
            ),
        };

        const {
          service,
        } = createService({
          coordinator,
        });

        const result =
          await service.install({
            packagePath,
          });

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            stage: 'FAILED',
            replayed: false,
            error:
              'PLUGIN_INSTALLATION_IN_PROGRESS',
          }),
        );

        expect(
          result.requestKey,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );
      },
    );

    it(
      'removes temporary materialized uploads after replay',
      async () => {
        const content =
          Buffer.from(
            'stored-plugin-artifact',
          );

        const coordinator = {
          coordinate:
            jest.fn(
              async (
                _requestKey: string,
                _operation:
                  () => Promise<unknown>,
                _succeeded:
                  (value: unknown) =>
                    boolean,
              ) => ({
                replayed: true,
                value: {
                  success: true,
                  stage:
                    'COMPLETE',
                  messages: [],
                },
              }),
            ),
        };

        const storageService = {
          getContent:
            jest.fn(
              async () =>
                content,
            ),
        };

        const {
          service,
        } = createService({
          coordinator,
          storageService,
        });

        await service.install({
          storageObjectId:
            'storage-object-1',
        });

        const uploadDirectory =
          join(
            workspace,
            'plugins',
            '.uploads',
          );

        expect(
          existsSync(
            uploadDirectory,
          ),
        ).toBe(true);

        expect(
          readdirSync(
            uploadDirectory,
          ),
        ).toEqual([]);
      },
    );

    it(
      'cleans extracted files after validation failure',
      async () => {
        const packagePath =
          join(
            workspace,
            'invalid.zip',
          );

        writeFileSync(
          packagePath,
          'invalid-plugin',
        );

        const rollbackService = {
          rollback:
            jest.fn(),
        };

        const validator = {
          validate:
            jest.fn(
              async () => [
                'Plugin validation failed',
              ],
            ),
        };

        const {
          service,
        } = createService({
          rollbackService,
          validator,
        });

        const result =
          await service.install({
            packagePath,
          });

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            error:
              'PLUGIN_VALIDATION_FAILED',
          }),
        );

        expect(
          rollbackService.rollback,
        ).toHaveBeenCalledWith(
          join(
            workspace,
            'extracted-plugin',
          ),
        );
      },
    );

    it(
      'reports manual recovery and preserves history after a post-migration failure',
      async () => {
        const packagePath =
          join(
            workspace,
            'migration-failure.zip',
          );

        writeFileSync(
          packagePath,
          'migration-failure-plugin',
        );

        const rollbackService = {
          rollback:
            jest.fn(),
        };

        const migrationRunner = {
          run:
            jest.fn(
              async () => ({
                executed: [
                  'plugins/example/001-create-table.sql',
                ],
                skipped: [],
              }),
            ),
          rollback:
            jest.fn(
              async (
                _migrationNames:
                  string[],
                _pluginRoot?:
                  string,
                _pluginName?:
                  string,
              ) => {
                throw new Error(
                  [
                    'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE:',
                    'schema migration history was preserved',
                  ].join(' '),
                );
              },
            ),
        };

        const pluginService = {
          installedPlugins:
            jest.fn(
              async () => [],
            ),
          install:
            jest.fn(
              async () => {
                throw new Error(
                  'plugin registration failed',
                );
              },
            ),
          activate:
            jest.fn(),
        };

        const eventBus = {
          publish:
            jest.fn(
              async (
                _eventName: string,
                _source: string,
                _payload: unknown,
              ) => undefined,
            ),
        };

        const {
          service,
        } = createService({
          rollbackService,
          migrationRunner,
          pluginService,
          eventBus,
        });

        const result =
          await service.install({
            packagePath,
          });

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            stage: 'FAILED',
            error:
              'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE',
            messages:
              expect.arrayContaining([
                'plugin registration failed',
                expect.stringContaining(
                  'schema migration history was preserved',
                ),
              ]),
          }),
        );

        expect(
          migrationRunner.rollback,
        ).toHaveBeenCalledWith(
          [
            'plugins/example/001-create-table.sql',
          ],
          join(
            workspace,
            'extracted-plugin',
          ),
          'test-plugin',
        );

        expect(
          rollbackService.rollback,
        ).toHaveBeenCalledWith(
          join(
            workspace,
            'extracted-plugin',
          ),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'plugin.installation.failed',
          'core.plugin.installer',
          expect.objectContaining({
            requiresManualRecovery:
              true,
            migrationRollbackError:
              expect.stringContaining(
                'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE',
              ),
          }),
        );
      },
    );
  },
);
