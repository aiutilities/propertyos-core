import {
  ConflictException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PluginService,
} from '../../../plugin/services/plugin.service';
import {
  MarketplaceCatalogService,
} from '../../services/marketplace-catalog.service';
import {
  MarketplaceUninstallService,
} from './marketplace-uninstall.service';

describe(
  'MarketplaceUninstallService',
  () => {
    it(
      'resolves the installed plugin and delegates to PluginService',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async (
                _slug: string,
              ) => ({
                pluginId:
                  'installed-plugin-id',
                slug:
                  'example-plugin',
              }),
            ),
        };

        const plugins = {
          uninstall:
            jest.fn(
              async (
                _id: string,
              ) => ({
                success: true,
                status:
                  'UNINSTALLED',
                plugin: {
                  id:
                    'installed-plugin-id',
                  status:
                    'UNINSTALLED',
                },
              }),
            ),
        };

        const service =
          new MarketplaceUninstallService(
            catalogue as unknown as
              MarketplaceCatalogService,
            plugins as unknown as
              PluginService,
          );

        const result =
          await service.uninstall(
            'example-plugin',
          );

        expect(
          catalogue.details,
        ).toHaveBeenCalledWith(
          'example-plugin',
        );

        expect(
          plugins.uninstall,
        ).toHaveBeenCalledWith(
          'installed-plugin-id',
        );

        expect(result).toMatchObject({
          success: true,
          status:
            'UNINSTALLED',
        });
      },
    );

    it(
      'preserves dependency-blocked results from PluginService',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async (
                _slug: string,
              ) => ({
                pluginId:
                  'installed-plugin-id',
              }),
            ),
        };

        const plugins = {
          uninstall:
            jest.fn(
              async (
                _id: string,
              ) => ({
                success: false,
                status:
                  'DEPENDENCY_BLOCKED',
                plugin:
                  'example-plugin',
                dependents: [
                  {
                    id:
                      'dependent-id',
                    name:
                      'dependent-plugin',
                    version:
                      '1.0.0',
                  },
                ],
                error:
                  'PLUGIN_UNINSTALL_BLOCKED_BY_DEPENDENCIES',
              }),
            ),
        };

        const service =
          new MarketplaceUninstallService(
            catalogue as unknown as
              MarketplaceCatalogService,
            plugins as unknown as
              PluginService,
          );

        const result =
          await service.uninstall(
            'example-plugin',
          );

        expect(result).toMatchObject({
          success: false,
          status:
            'DEPENDENCY_BLOCKED',
          error:
            'PLUGIN_UNINSTALL_BLOCKED_BY_DEPENDENCIES',
        });

        expect(
          'dependents' in result,
        ).toBe(true);

        if (!('dependents' in result)) {
          throw new Error(
            'Expected dependency-blocked uninstall result',
          );
        }

        expect(
          result.dependents,
        ).toHaveLength(1);
      },
    );

    it(
      'rejects uninstall when the marketplace entry is not linked to an installed plugin',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async (
                _slug: string,
              ) => ({
                pluginId: null,
              }),
            ),
        };

        const plugins = {
          uninstall:
            jest.fn(),
        };

        const service =
          new MarketplaceUninstallService(
            catalogue as unknown as
              MarketplaceCatalogService,
            plugins as unknown as
              PluginService,
          );

        await expect(
          service.uninstall(
            'example-plugin',
          ),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          plugins.uninstall,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
