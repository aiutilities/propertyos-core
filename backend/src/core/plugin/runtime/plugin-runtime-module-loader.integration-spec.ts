import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  PluginRuntimeModuleLoadError,
  PluginRuntimeModuleLoaderService,
} from './plugin-runtime-module-loader.service';
import { PluginManifest } from '../manifest/plugin-manifest.interface';

describe(
  'PluginRuntimeModuleLoaderService',
  () => {
    let root: string;
    let service:
      PluginRuntimeModuleLoaderService;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-runtime-loader-',
        ),
      );

      mkdirSync(
        join(root, 'dist'),
        { recursive: true },
      );

      service =
        new PluginRuntimeModuleLoaderService();
    });

    afterEach(() => {
      rmSync(
        root,
        {
          recursive: true,
          force: true,
        },
      );
    });

    const manifest = (
      overrides:
        Partial<PluginManifest> = {},
    ): PluginManifest => ({
      id: 'example',
      name: 'Example',
      version: '0.1.0',
      provider: 'PropertyOS',
      entrypoint: 'dist/index.js',
      bootstrap: 'dist/index.js',
      moduleClass: 'ExampleModule',
      ...overrides,
    });

    const writeModule = (
      source = `
        class ExampleModule {}
        Reflect.defineMetadata(
          'imports',
          [],
          ExampleModule,
        );
        module.exports = {
          ExampleModule,
          SECONDARY_EXPORT: true,
        };
      `,
    ): void => {
      writeFileSync(
        join(
          root,
          'dist',
          'index.js',
        ),
        source,
      );
    };

    it(
      'loads a compiled NestJS module export',
      () => {
        writeModule();

        const loaded = service.load(
          root,
          manifest(),
        );

        expect(
          loaded.pluginId,
        ).toBe('example');

        expect(
          loaded.moduleClassName,
        ).toBe('ExampleModule');

        expect(
          typeof loaded.moduleClass,
        ).toBe('function');

        expect(
          loaded.exportNames,
        ).toEqual([
          'ExampleModule',
          'SECONDARY_EXPORT',
        ]);

        expect(
          service.get('example'),
        ).toBe(loaded);

        expect(
          service.list(),
        ).toEqual([loaded]);
      },
    );

    it(
      'uses bootstrap when entrypoint is absent',
      () => {
        writeModule();

        const loaded = service.load(
          root,
          manifest({
            entrypoint: undefined,
          }),
        );

        expect(
          loaded.entrypoint.endsWith(
            '/dist/index.js',
          ),
        ).toBe(true);
      },
    );

    it(
      'returns the cached runtime for an identical load',
      () => {
        writeModule();

        const first = service.load(
          root,
          manifest(),
        );

        const second = service.load(
          root,
          manifest(),
        );

        expect(second).toBe(first);
      },
    );

    it(
      'unloads runtime metadata',
      () => {
        writeModule();

        service.load(
          root,
          manifest(),
        );

        expect(
          service.has('example'),
        ).toBe(true);

        expect(
          service.unload('example'),
        ).toBe(true);

        expect(
          service.has('example'),
        ).toBe(false);
      },
    );

    it.each([
      '../outside.js',
      '/tmp/outside.js',
      'dist/index.ts',
      'dist\\index.js',
    ])(
      'rejects unsafe entrypoint %s',
      (entrypoint) => {
        expect(
          () =>
            service.load(
              root,
              manifest({
                entrypoint,
              }),
            ),
        ).toThrow(
          PluginRuntimeModuleLoadError,
        );
      },
    );

    it(
      'rejects a symlink that resolves outside the root',
      () => {
        const outside = join(
          tmpdir(),
          `propertyos-outside-${Date.now()}.js`,
        );

        writeFileSync(
          outside,
          'module.exports = {};',
        );

        const linked = join(
          root,
          'dist',
          'index.js',
        );

        symlinkSync(
          outside,
          linked,
        );

        try {
          expect(
            () =>
              service.load(
                root,
                manifest(),
              ),
          ).toThrow(
            /outside the plugin root/,
          );
        } finally {
          rmSync(
            outside,
            { force: true },
          );
        }
      },
    );

    it(
      'rejects a missing entrypoint',
      () => {
        expect(
          () =>
            service.load(
              root,
              manifest(),
            ),
        ).toThrow(
          /does not exist/,
        );
      },
    );

    it(
      'rejects a missing named export',
      () => {
        writeModule(
          'module.exports = {};',
        );

        expect(
          () =>
            service.load(
              root,
              manifest(),
            ),
        ).toThrow(
          /does not export ExampleModule/,
        );
      },
    );

    it(
      'rejects a non-class export',
      () => {
        writeModule(
          `module.exports = {
            ExampleModule: {},
          };`,
        );

        expect(
          () =>
            service.load(
              root,
              manifest(),
            ),
        ).toThrow(
          /does not export ExampleModule/,
        );
      },
    );

    it(
      'rejects a class without NestJS module metadata',
      () => {
        writeModule(
          `
            class ExampleModule {}
            module.exports = {
              ExampleModule,
            };
          `,
        );

        expect(
          () =>
            service.load(
              root,
              manifest(),
            ),
        ).toThrow(
          /not a NestJS module/,
        );
      },
    );

    it(
      'rejects an invalid moduleClass identifier',
      () => {
        writeModule();

        expect(
          () =>
            service.load(
              root,
              manifest({
                moduleClass:
                  '../ExampleModule',
              }),
            ),
        ).toThrow(
          /moduleClass is invalid/,
        );
      },
    );

    it(
      'rejects conflicting duplicate plugin IDs',
      () => {
        writeModule();

        service.load(
          root,
          manifest(),
        );

        expect(
          () =>
            service.load(
              root,
              manifest({
                moduleClass:
                  'DifferentModule',
              }),
            ),
        ).toThrow(
          /already loaded/,
        );
      },
    );
  },
);
