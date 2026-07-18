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
import {
  PluginRuntimeModuleLoaderService,
} from './plugin-runtime-module-loader.service';
import {
  PluginRuntimeBootstrapPlannerService,
} from './plugin-runtime-bootstrap-planner.service';

describe(
  'PluginRuntimeBootstrapPlannerService',
  () => {
    let root: string;
    let planner:
      PluginRuntimeBootstrapPlannerService;

    beforeEach(() => {
      root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-bootstrap-plan-',
        ),
      );

      planner =
        new PluginRuntimeBootstrapPlannerService(
          new PluginRuntimeModuleLoaderService(),
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

    const writePlugin = (
      pluginId: string,
      moduleClass:
        string,
      source?: string,
    ): void => {
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
          'plugin.json',
        ),
        JSON.stringify({
          id: pluginId,
          name:
            pluginId
              .charAt(0)
              .toUpperCase() +
            pluginId.slice(1),
          version: '0.1.0',
          provider:
            'PropertyOS',
          entrypoint:
            'dist/index.js',
          bootstrap:
            'dist/index.js',
          moduleClass,
        }),
      );

      writeFileSync(
        join(
          pluginRoot,
          'dist',
          'index.js',
        ),
        source ??
          `
            class ${moduleClass} {}
            Reflect.defineMetadata(
              'imports',
              [],
              ${moduleClass},
            );
            module.exports = {
              ${moduleClass},
            };
          `,
      );
    };

    it(
      'plans a safe external plugin',
      () => {
        writePlugin(
          'helpdesk',
          'HelpdeskModule',
        );

        const plan =
          planner.plan(
            ['helpdesk'],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(true);

        expect(
          plan.readyPluginIds,
        ).toEqual([
          'helpdesk',
        ]);

        expect(
          plan.candidates[0]
            .runtime
            ?.moduleClassName,
        ).toBe(
          'HelpdeskModule',
        );
      },
    );

    it(
      'plans Invoice as a safe external plugin',
      () => {
        writePlugin(
          'invoice',
          'InvoiceModule',
        );

        const plan =
          planner.plan(
            ['invoice'],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(true);

        expect(
          plan.readyPluginIds,
        ).toEqual([
          'invoice',
        ]);

        expect(
          plan.candidates[0]
            .runtime
            ?.moduleClassName,
        ).toBe(
          'InvoiceModule',
        );
      },
    );

    it(
      'plans Receipt as a safe external plugin',
      () => {
        writePlugin(
          'receipt',
          'ReceiptModule',
        );

        const plan =
          planner.plan(
            ['receipt'],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(true);

        expect(
          plan.readyPluginIds,
        ).toEqual([
          'receipt',
        ]);

        expect(
          plan.candidates[0]
            .runtime
            ?.moduleClassName,
        ).toBe(
          'ReceiptModule',
        );
      },
    );

    it(
      'plans Report as a safe external plugin',
      () => {
        writePlugin(
          'report',
          'ReportModule',
        );

        const plan =
          planner.plan(
            ['report'],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(true);

        expect(
          plan.readyPluginIds,
        ).toEqual([
          'report',
        ]);

        expect(
          plan.candidates[0]
            .runtime
            ?.moduleClassName,
        ).toBe(
          'ReportModule',
        );
      },
    );

    it(
      'normalizes and deduplicates requests',
      () => {
        writePlugin(
          'helpdesk',
          'HelpdeskModule',
        );

        const plan =
          planner.plan(
            [
              ' Helpdesk ',
              'helpdesk',
              '',
            ],
            root,
          );

        expect(
          plan.requestedPluginIds,
        ).toEqual([
          'helpdesk',
        ]);
      },
    );

    it(
      'reports a missing runtime bundle',
      () => {
        const plan =
          planner.plan(
            ['helpdesk'],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(false);

        expect(
          plan.missingPluginIds,
        ).toEqual([
          'helpdesk',
        ]);
      },
    );

    it.each([
      [
        'agreement',
        'AdminModule',
      ],
      [
        'inventory',
        'ProcurementModule',
      ],
    ])(
      'blocks %s because it remains a monolith dependency',
      (
        pluginId,
        consumer,
      ) => {
        const plan =
          planner.plan(
            [pluginId],
            root,
          );

        expect(
          plan.blockedPluginIds,
        ).toEqual([
          pluginId,
        ]);

        expect(
          plan.candidates[0]
            .reasons.join(' '),
        ).toContain(
          consumer,
        );
      },
    );

    it(
      'reports an invalid runtime module',
      () => {
        writePlugin(
          'helpdesk',
          'HelpdeskModule',
          `
            module.exports = {
              HelpdeskModule: {},
            };
          `,
        );

        const plan =
          planner.plan(
            ['helpdesk'],
            root,
          );

        expect(
          plan.failedPluginIds,
        ).toEqual([
          'helpdesk',
        ]);

        expect(
          plan.readyToBootstrap,
        ).toBe(false);
      },
    );

    it(
      'returns an empty non-ready plan for no requests',
      () => {
        const plan =
          planner.plan(
            [],
            root,
          );

        expect(
          plan.requestedPluginIds,
        ).toEqual([]);

        expect(
          plan.readyToBootstrap,
        ).toBe(false);
      },
    );

    it(
      'plans multiple safe plugins in deterministic order',
      () => {
        writePlugin(
          'helpdesk',
          'HelpdeskModule',
        );

        writePlugin(
          'facility',
          'FacilityModule',
        );

        const plan =
          planner.plan(
            [
              'helpdesk',
              'facility',
            ],
            root,
          );

        expect(
          plan.readyToBootstrap,
        ).toBe(true);

        expect(
          plan.readyPluginIds,
        ).toEqual([
          'facility',
          'helpdesk',
        ]);
      },
    );
  },
);
