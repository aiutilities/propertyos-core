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

import {
  resolveRuntimeBusinessModules,
} from './plugin-runtime-bootstrap';

interface PluginFixture {
  pluginId: string;
  moduleClass: string;
  controllerClass: string;
  controllerPrefix: string;
  methodPath: string;
  requestPath: string;
}

const PLUGINS:
  PluginFixture[] = [
    {
      pluginId:
        'communications',
      moduleClass:
        'CommunicationsModule',
      controllerClass:
        'CommunicationsController',
      controllerPrefix:
        'communications',
      methodPath: '',
      requestPath:
        '/api/v1/communications',
    },
    {
      pluginId:
        'facility',
      moduleClass:
        'FacilityModule',
      controllerClass:
        'FacilityController',
      controllerPrefix:
        'facilities',
      methodPath:
        'categories',
      requestPath:
        '/api/v1/facilities/categories',
    },
    {
      pluginId:
        'helpdesk',
      moduleClass:
        'HelpdeskModule',
      controllerClass:
        'HelpdeskController',
      controllerPrefix:
        'helpdesk',
      methodPath: '',
      requestPath:
        '/api/v1/helpdesk',
    },
    {
      pluginId:
        'maintenance',
      moduleClass:
        'MaintenanceModule',
      controllerClass:
        'MaintenanceController',
      controllerPrefix:
        'maintenance',
      methodPath: '',
      requestPath:
        '/api/v1/maintenance',
    },
    {
      pluginId:
        'reservation',
      moduleClass:
        'ReservationModule',
      controllerClass:
        'ReservationController',
      controllerPrefix:
        'reservations',
      methodPath: '',
      requestPath:
        '/api/v1/reservations',
    },
    {
      pluginId:
        'staff',
      moduleClass:
        'StaffModule',
      controllerClass:
        'StaffController',
      controllerPrefix:
        'staff',
      methodPath: '',
      requestPath:
        '/api/v1/staff',
    },
    {
      pluginId:
        'vehicle',
      moduleClass:
        'VehicleModule',
      controllerClass:
        'VehicleController',
      controllerPrefix:
        'vehicles',
      methodPath: '',
      requestPath:
        '/api/v1/vehicles',
    },
    {
      pluginId:
        'vendor',
      moduleClass:
        'VendorModule',
      controllerClass:
        'VendorController',
      controllerPrefix:
        'vendors',
      methodPath: '',
      requestPath:
        '/api/v1/vendors',
    },
  ];

describe(
  'external plugin portfolio route bootstrap',
  () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-portfolio-route-',
        ),
      );

      for (
        const plugin
        of PLUGINS
      ) {
        const pluginRoot =
          join(
            root,
            plugin.pluginId,
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
            id:
              plugin.pluginId,
            name:
              plugin.pluginId,
            version: '0.1.0',
            provider:
              'PropertyOS',
            entrypoint:
              'dist/index.js',
            bootstrap:
              'dist/index.js',
            moduleClass:
              plugin.moduleClass,
          }),
        );

        writeFileSync(
          join(
            pluginRoot,
            'dist',
            'index.js',
          ),
          `
            class ${plugin.controllerClass} {
              list() {
                return {
                  pluginId:
                    '${plugin.pluginId}',
                  source:
                    'external-runtime',
                };
              }
            }

            Reflect.defineMetadata(
              '__controller__',
              true,
              ${plugin.controllerClass},
            );

            Reflect.defineMetadata(
              'path',
              '${plugin.controllerPrefix}',
              ${plugin.controllerClass},
            );

            const list =
              ${plugin.controllerClass}
                .prototype
                .list;

            Reflect.defineMetadata(
              'path',
              '${plugin.methodPath}',
              list,
            );

            Reflect.defineMetadata(
              'method',
              0,
              list,
            );

            class ${plugin.moduleClass} {}

            Reflect.defineMetadata(
              'imports',
              [],
              ${plugin.moduleClass},
            );

            Reflect.defineMetadata(
              'providers',
              [],
              ${plugin.moduleClass},
            );

            Reflect.defineMetadata(
              'controllers',
              [
                ${plugin.controllerClass},
              ],
              ${plugin.moduleClass},
            );

            Reflect.defineMetadata(
              'exports',
              [],
              ${plugin.moduleClass},
            );

            module.exports = {
              ${plugin.moduleClass},
            };
          `,
        );
      }
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
      'registers all eight external plugin routes',
      async () => {
        const requested =
          PLUGINS.map(
            (plugin) =>
              plugin.pluginId,
          );

        const modules =
          resolveRuntimeBusinessModules({
            externalPluginIds:
              requested,
            runtimeRoot:
              root,
          });

        const externalModules =
          requested.map(
            (pluginId) =>
              modules[
                pluginId as keyof
                  typeof modules
              ],
          );

        expect(
          new Set(
            externalModules,
          ).size,
        ).toBe(8);

        const testingModule =
          await Test
            .createTestingModule({
              imports:
                externalModules,
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

          for (
            const plugin
            of PLUGINS
          ) {
            const response =
              await request(
                app.getHttpServer(),
              )
                .get(
                  plugin.requestPath,
                )
                .expect(200);

            expect(
              response.body,
            ).toEqual({
              pluginId:
                plugin.pluginId,
              source:
                'external-runtime',
            });
          }
        } finally {
          await app.close();
        }
      },
    );
  },
);
