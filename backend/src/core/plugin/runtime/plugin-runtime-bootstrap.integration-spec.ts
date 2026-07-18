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
import { tmpdir } from 'os';
import { join } from 'path';

import { HelpdeskModule } from '../../helpdesk/helpdesk.module';
import {
  requestedExternalPluginIds,
  resolveRuntimeBusinessModules,
} from './plugin-runtime-bootstrap';

describe(
  'runtime business module bootstrap',
  () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-runtime-bootstrap-',
        ),
      );
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

    const writeHelpdesk =
      (): void => {
        const pluginRoot =
          join(
            root,
            'helpdesk',
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
            'plugin.json',
          ),
          JSON.stringify({
            id: 'helpdesk',
            name: 'Helpdesk',
            version: '0.1.0',
            provider:
              'PropertyOS',
            entrypoint:
              'dist/index.js',
            bootstrap:
              'dist/index.js',
            moduleClass:
              'HelpdeskModule',
          }),
        );

        writeFileSync(
          join(
            pluginRoot,
            'package.json',
          ),
          JSON.stringify({
            name:
              '@propertyos/plugin-helpdesk',
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
          `
            class HelpdeskModule {}
            Reflect.defineMetadata(
              'imports',
              [],
              HelpdeskModule,
            );
            module.exports = {
              HelpdeskModule,
            };
          `,
        );
      };

    it(
      'preserves every monolith module by default',
      () => {
        const modules =
          resolveRuntimeBusinessModules({
            externalPluginIds: [],
            runtimeRoot: root,
          });

        expect(
          modules.helpdesk,
        ).toBe(
          HelpdeskModule,
        );

        expect(
          Object.keys(modules),
        ).toHaveLength(16);
      },
    );

    it(
      'replaces Helpdesk with its external runtime module',
      () => {
        writeHelpdesk();

        const modules =
          resolveRuntimeBusinessModules({
            externalPluginIds: [
              'helpdesk',
            ],
            runtimeRoot: root,
          });

        expect(
          modules.helpdesk.name,
        ).toBe(
          'HelpdeskModule',
        );

        expect(
          modules.helpdesk,
        ).not.toBe(
          HelpdeskModule,
        );
      },
    );

    it(
      'rejects a missing external Helpdesk bundle',
      () => {
        expect(
          () =>
            resolveRuntimeBusinessModules({
              externalPluginIds: [
                'helpdesk',
              ],
              runtimeRoot: root,
            }),
        ).toThrow(
          /Installed runtime bundle was not found/,
        );
      },
    );

    it(
      'rejects Procurement without external Inventory',
      () => {
        expect(
          () =>
            resolveRuntimeBusinessModules({
              externalPluginIds: [
                'procurement',
              ],
              runtimeRoot: root,
            }),
        ).toThrow(
          /dependencies must also be requested: inventory/,
        );
      },
    );

    it(
      'rejects an unknown plugin ID',
      () => {
        expect(
          () =>
            resolveRuntimeBusinessModules({
              externalPluginIds: [
                'unknown',
              ],
              runtimeRoot: root,
            }),
        ).toThrow(
          /Unknown external business plugins/,
        );
      },
    );

    it(
      'normalizes environment plugin IDs',
      () => {
        expect(
          requestedExternalPluginIds(
            ' Helpdesk,facility,helpdesk ',
          ),
        ).toEqual([
          'facility',
          'helpdesk',
        ]);
      },
    );
  },
);
