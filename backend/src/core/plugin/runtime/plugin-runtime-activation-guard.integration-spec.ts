import {
  Controller,
  Module,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { ModulesContainer } from '@nestjs/core';
import {
  LoadedPluginRuntimeModule,
} from './plugin-runtime-module-loader.service';
import {
  PluginRuntimeActivationGuardService,
} from './plugin-runtime-activation-guard.service';

interface FakeModuleReference {
  metatype?: new (
    ...args: never[]
  ) => unknown;
  controllers: Map<
    string,
    {
      metatype?: new (
        ...args: never[]
      ) => unknown;
    }
  >;
}

describe(
  'PluginRuntimeActivationGuardService',
  () => {
    const container = (
      modules:
        FakeModuleReference[],
    ): ModulesContainer =>
      new Map(
        modules.map(
          (module, index) => [
            String(index),
            module,
          ],
        ),
      ) as unknown as
        ModulesContainer;

    const runtime = (
      moduleClass:
        new (...args: never[]) =>
          unknown,
      moduleClassName =
        moduleClass.name,
    ): LoadedPluginRuntimeModule => ({
      pluginId: 'helpdesk',
      moduleClassName,
      entrypoint:
        '/plugins/helpdesk/dist/index.js',
      moduleClass,
      exportNames: [
        moduleClassName,
      ],
    });

    it(
      'allows a module without host conflicts',
      () => {
        @Module({})
        class ExternalModule {}

        @Module({})
        class HostModule {}

        const guard =
          new PluginRuntimeActivationGuardService(
            container([
              {
                metatype:
                  HostModule,
                controllers:
                  new Map(),
              },
            ]),
          );

        const assessment =
          guard.assess(
            runtime(
              ExternalModule,
            ),
          );

        expect(
          assessment.safeToActivate,
        ).toBe(true);

        expect(
          assessment.conflicts,
        ).toEqual([]);
      },
    );

    it(
      'blocks an existing module class name',
      () => {
        @Module({})
        class HelpdeskModule {}

        const ExistingHelpdeskModule =
          class HelpdeskModule {};

        const guard =
          new PluginRuntimeActivationGuardService(
            container([
              {
                metatype:
                  ExistingHelpdeskModule,
                controllers:
                  new Map(),
              },
            ]),
          );

        const assessment =
          guard.assess(
            runtime(
              HelpdeskModule,
            ),
          );

        expect(
          assessment.safeToActivate,
        ).toBe(false);

        expect(
          assessment.conflicts,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type:
                'MODULE_CLASS',
              candidate:
                'HelpdeskModule',
              existing:
                'HelpdeskModule',
            }),
          ]),
        );
      },
    );

    it(
      'blocks an existing controller route',
      () => {
        @Controller(
          'helpdesk',
        )
        class PluginHelpdeskController {}

        @Module({
          controllers: [
            PluginHelpdeskController,
          ],
        })
        class ExternalModule {}

        @Controller(
          '/helpdesk/',
        )
        class HostHelpdeskController {}

        @Module({})
        class HostModule {}

        const guard =
          new PluginRuntimeActivationGuardService(
            container([
              {
                metatype:
                  HostModule,
                controllers:
                  new Map([
                    [
                      'host-helpdesk',
                      {
                        metatype:
                          HostHelpdeskController,
                      },
                    ],
                  ]),
              },
            ]),
          );

        const assessment =
          guard.assess(
            runtime(
              ExternalModule,
            ),
          );

        expect(
          assessment.safeToActivate,
        ).toBe(false);

        expect(
          assessment.conflicts,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type:
                'CONTROLLER_ROUTE',
              candidate:
                'PluginHelpdeskController',
              existing:
                'HostHelpdeskController',
              detail:
                'Controller route is already active: ' +
                '/helpdesk',
            }),
          ]),
        );
      },
    );

    it(
      'allows different controller routes',
      () => {
        @Controller(
          'external-feature',
        )
        class ExternalController {}

        @Module({
          controllers: [
            ExternalController,
          ],
        })
        class ExternalModule {}

        @Controller(
          'host-feature',
        )
        class HostController {}

        const guard =
          new PluginRuntimeActivationGuardService(
            container([
              {
                controllers:
                  new Map([
                    [
                      'host',
                      {
                        metatype:
                          HostController,
                      },
                    ],
                  ]),
              },
            ]),
          );

        expect(
          guard.assess(
            runtime(
              ExternalModule,
            ),
          ).safeToActivate,
        ).toBe(true);
      },
    );

    it(
      'throws a descriptive activation error',
      () => {
        @Module({})
        class HelpdeskModule {}

        const ExistingHelpdeskModule =
          class HelpdeskModule {};

        const guard =
          new PluginRuntimeActivationGuardService(
            container([
              {
                metatype:
                  ExistingHelpdeskModule,
                controllers:
                  new Map(),
              },
            ]),
          );

        expect(
          () =>
            guard.assertSafe(
              runtime(
                HelpdeskModule,
              ),
            ),
        ).toThrow(
          'Plugin runtime activation blocked ' +
          'for helpdesk',
        );
      },
    );
  },
);
