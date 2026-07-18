import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';

import { HelpdeskModule } from '../../helpdesk/helpdesk.module';
import {
  resolveRuntimeBusinessModules,
} from './plugin-runtime-bootstrap';

describe(
  'external plugin route bootstrap',
  () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-route-bootstrap-',
        ),
      );

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
          provider: 'PropertyOS',
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
          'dist',
          'index.js',
        ),
        `
          class HelpdeskController {
            list() {
              return {
                source:
                  'external-helpdesk',
              };
            }
          }

          Reflect.defineMetadata(
            '__controller__',
            true,
            HelpdeskController,
          );

          Reflect.defineMetadata(
            'path',
            'helpdesk',
            HelpdeskController,
          );

          const list =
            HelpdeskController
              .prototype
              .list;

          Reflect.defineMetadata(
            'path',
            '',
            list,
          );

          Reflect.defineMetadata(
            'method',
            0,
            list,
          );

          class HelpdeskModule {}

          Reflect.defineMetadata(
            'imports',
            [],
            HelpdeskModule,
          );

          Reflect.defineMetadata(
            'providers',
            [],
            HelpdeskModule,
          );

          Reflect.defineMetadata(
            'controllers',
            [
              HelpdeskController,
            ],
            HelpdeskModule,
          );

          Reflect.defineMetadata(
            'exports',
            [],
            HelpdeskModule,
          );

          module.exports = {
            HelpdeskModule,
          };
        `,
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

    it(
      'registers the external route instead of the monolith module',
      async () => {
        const modules =
          resolveRuntimeBusinessModules({
            externalPluginIds: [
              'helpdesk',
            ],
            runtimeRoot:
              root,
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

        const testingModule =
          await Test
            .createTestingModule({
              imports: [
                modules.helpdesk,
              ],
            })
            .compile();

        const app =
          testingModule
            .createNestApplication();

        app.setGlobalPrefix(
          'api/v1',
        );

        try {
          await app.init();

          const response =
            await request(
              app.getHttpServer(),
            )
              .get(
                '/api/v1/helpdesk',
              )
              .expect(200);

          expect(
            response.body,
          ).toEqual({
            source:
              'external-helpdesk',
          });
        } finally {
          await app.close();
        }
      },
    );
  },
);
