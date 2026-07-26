import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PluginDependencyResolverService,
} from '../../../plugin/installer/dependency/plugin-dependency-resolver.service';
import {
  PluginService,
} from '../../../plugin/services/plugin.service';
import {
  MarketplaceCatalogService,
} from '../../services/marketplace-catalog.service';
import {
  MarketplaceVersionService,
} from '../../version/services/marketplace-version.service';
import {
  MarketplaceResolutionPlannerService,
} from './marketplace-resolution-planner.service';

describe(
  'MarketplaceResolutionPlannerService',
  () => {
    const createPlanner = (
      options: {
        pluginId?: string | null;
        installed?: Array<{
          id: string;
          name: string;
          version: string;
          status: string;
        }>;
        targetVersion?: string;
        minimumPlatformVersion?:
          string | null;
        dependencies?: string[];
      } = {},
    ) => {
      const catalogue = {
        details:
          jest.fn(
            async (
              _slug: string,
            ) => ({
              pluginId:
                options.pluginId ??
                null,
            }),
          ),
      };

      const versions = {
        details:
          jest.fn(
            async (
              _slug: string,
              _version: string,
            ) => ({
              publicationId:
                'publication-id',
              version:
                options.targetVersion ??
                '2.0.0',
              minimumPlatformVersion:
                options.minimumPlatformVersion ??
                null,
              dependencies:
                options.dependencies ??
                [],
            }),
          ),
      };

      const plugins = {
        installedPlugins:
          jest.fn(
            async () =>
              options.installed ??
              [],
          ),
      };

      const resolver =
        new PluginDependencyResolverService();

      return new MarketplaceResolutionPlannerService(
        catalogue as unknown as
          MarketplaceCatalogService,
        versions as unknown as
          MarketplaceVersionService,
        plugins as unknown as
          PluginService,
        resolver,
      );
    };

    it(
      'plans installation for an uninstalled compatible plugin',
      async () => {
        const planner =
          createPlanner({
            dependencies: [],
          });

        const result =
          await planner.plan(
            'example-plugin',
            '2.0.0',
          );

        expect(result).toMatchObject({
          action:
            'INSTALL',
          executable:
            true,
          platformCompatible:
            true,
          installedPluginId:
            null,
          installedVersion:
            null,
          executionOrder: [
            'example-plugin',
          ],
        });
      },
    );

    it(
      'plans an upgrade for an installed lower version',
      async () => {
        const planner =
          createPlanner({
            pluginId:
              'installed-id',
            targetVersion:
              '2.0.0',
            installed: [
              {
                id:
                  'installed-id',
                name:
                  'example-plugin',
                version:
                  '1.0.0',
                status:
                  'ACTIVE',
              },
            ],
          });

        const result =
          await planner.plan(
            'example-plugin',
            '2.0.0',
          );

        expect(result).toMatchObject({
          action:
            'UPGRADE',
          executable:
            true,
          installedPluginId:
            'installed-id',
          installedVersion:
            '1.0.0',
        });
      },
    );

    it(
      'plans rollback when the approved target is lower',
      async () => {
        const planner =
          createPlanner({
            pluginId:
              'installed-id',
            targetVersion:
              '1.0.0',
            installed: [
              {
                id:
                  'installed-id',
                name:
                  'example-plugin',
                version:
                  '2.0.0',
                status:
                  'ACTIVE',
              },
            ],
          });

        const result =
          await planner.plan(
            'example-plugin',
            '1.0.0',
          );

        expect(result.action).toBe(
          'ROLLBACK',
        );
      },
    );

    it(
      'blocks a plan with missing dependencies',
      async () => {
        const planner =
          createPlanner({
            dependencies: [
              'required-plugin@^1.0.0',
            ],
          });

        const result =
          await planner.plan(
            'example-plugin',
            '2.0.0',
          );

        expect(result).toMatchObject({
          executable:
            false,
          missingDependencies: [
            'required-plugin',
          ],
          executionOrder: [
            'required-plugin',
            'example-plugin',
          ],
        });

        expect(
          result.errors[0],
        ).toContain(
          'Missing plugin dependency',
        );
      },
    );

    it(
      'blocks a plan with an incompatible dependency version',
      async () => {
        const planner =
          createPlanner({
            dependencies: [
              'required-plugin@^2.0.0',
            ],
            installed: [
              {
                id:
                  'dependency-id',
                name:
                  'required-plugin',
                version:
                  '1.0.0',
                status:
                  'ACTIVE',
              },
            ],
          });

        const result =
          await planner.plan(
            'example-plugin',
            '2.0.0',
          );

        expect(
          result.executable,
        ).toBe(false);

        expect(
          result.dependencies[0],
        ).toMatchObject({
          name:
            'required-plugin',
          installedVersion:
            '1.0.0',
          satisfied:
            false,
        });
      },
    );

    it(
      'blocks a platform-incompatible version',
      async () => {
        const previous =
          process.env
            .PROPERTYOS_PLATFORM_VERSION;

        process.env
          .PROPERTYOS_PLATFORM_VERSION =
          '0.1.0';

        try {
          const planner =
            createPlanner({
              minimumPlatformVersion:
                '1.0.0',
            });

          const result =
            await planner.plan(
              'example-plugin',
              '2.0.0',
            );

          expect(result).toMatchObject({
            executable:
              false,
            platformCompatible:
              false,
            currentPlatformVersion:
              '0.1.0',
            minimumPlatformVersion:
              '1.0.0',
          });
        } finally {
          if (
            previous === undefined
          ) {
            delete process.env
              .PROPERTYOS_PLATFORM_VERSION;
          } else {
            process.env
              .PROPERTYOS_PLATFORM_VERSION =
              previous;
          }
        }
      },
    );
  },
);
