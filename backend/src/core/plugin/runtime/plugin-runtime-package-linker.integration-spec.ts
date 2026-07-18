import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  mkdirSync,
  mkdtempSync,
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
  createRequire,
} from 'module';

import {
  PluginRuntimePackageLinkerService,
} from './plugin-runtime-package-linker.service';

describe(
  'PluginRuntimePackageLinkerService',
  () => {
    let root: string;
    let linker:
      PluginRuntimePackageLinkerService;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-runtime-links-',
        ),
      );

      linker =
        new PluginRuntimePackageLinkerService();
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

    const writePlugin = (
      pluginId: string,
    ): string => {
      const pluginRoot =
        join(
          root,
          pluginId,
        );

      mkdirSync(
        join(
          pluginRoot,
          'dist',
        ),
        {
          recursive: true,
        },
      );

      writeFileSync(
        join(
          pluginRoot,
          'package.json',
        ),
        JSON.stringify({
          name:
            `@propertyos/plugin-${pluginId}`,
          version:
            '0.1.0',
          main:
            'dist/index.js',
        }),
      );

      writeFileSync(
        join(
          pluginRoot,
          'dist',
          'index.js',
        ),
        `module.exports = {
          pluginId: '${pluginId}',
        };`,
      );

      return pluginRoot;
    };

    it(
      'links an installed plugin as a shared package',
      () => {
        writePlugin(
          'inventory',
        );

        const links =
          linker.prepare(
            root,
            [
              'inventory',
            ],
          );

        expect(
          links,
        ).toHaveLength(1);

        const runtimeRequire =
          createRequire(
            join(
              root,
              'runtime-host.js',
            ),
          );

        expect(
          runtimeRequire(
            '@propertyos/plugin-inventory',
          ),
        ).toEqual({
          pluginId:
            'inventory',
        });
      },
    );

    it(
      'is deterministic for an existing correct link',
      () => {
        writePlugin(
          'inventory',
        );

        const first =
          linker.prepare(
            root,
            [
              'inventory',
            ],
          );

        const second =
          linker.prepare(
            root,
            [
              'inventory',
            ],
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'skips a requested plugin that is not installed',
      () => {
        expect(
          linker.prepare(
            root,
            [
              'missing',
            ],
          ),
        ).toEqual([]);
      },
    );

    it(
      'rejects an unsafe plugin ID',
      () => {
        expect(
          () =>
            linker.prepare(
              root,
              [
                '../inventory',
              ],
            ),
        ).toThrow(
          /plugin ID is invalid/,
        );
      },
    );
  },
);
