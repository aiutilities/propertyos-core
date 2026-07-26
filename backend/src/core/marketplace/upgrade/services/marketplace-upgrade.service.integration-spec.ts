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
  MarketplaceVersionService,
} from '../../version/services/marketplace-version.service';
import {
  MarketplaceUpgradeService,
} from './marketplace-upgrade.service';

describe(
  'MarketplaceUpgradeService',
  () => {
    it(
      'resolves an approved release and delegates to PluginService',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async (
                _slug: string,
              ) => ({
                id:
                  'marketplace-entry',
                pluginId:
                  'installed-plugin-id',
                slug:
                  'example-plugin',
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
                  '2.0.0',
              }),
            ),
        };

        const plugins = {
          upgrade:
            jest.fn(
              async (
                _id: string,
                dto: {
                  version: string;
                  notes?: string;
                },
              ) => ({
                success: true,
                status: 'UPGRADED',
                fromVersion:
                  '1.0.0',
                toVersion:
                  dto.version,
              }),
            ),
        };

        const service =
          new MarketplaceUpgradeService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        const result =
          await service.upgrade(
            'example-plugin',
            '2.0.0',
            'Approved marketplace upgrade',
          );

        expect(
          catalogue.details,
        ).toHaveBeenCalledWith(
          'example-plugin',
        );

        expect(
          versions.details,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '2.0.0',
        );

        expect(
          plugins.upgrade,
        ).toHaveBeenCalledWith(
          'installed-plugin-id',
          {
            version:
              '2.0.0',
            notes:
              'Approved marketplace upgrade',
          },
        );

        expect(result).toMatchObject({
          success: true,
          status: 'UPGRADED',
          fromVersion:
            '1.0.0',
          toVersion:
            '2.0.0',
        });
      },
    );

    it(
      'uses the approved projected version instead of client provenance',
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

        const versions = {
          details:
            jest.fn(
              async (
                _slug: string,
                _version: string,
              ) => ({
                version:
                  '3.1.0',
              }),
            ),
        };

        const plugins = {
          upgrade:
            jest.fn(
              async (
                _id: string,
                dto: {
                  version: string;
                  notes?: string;
                },
              ) => dto,
            ),
        };

        const service =
          new MarketplaceUpgradeService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        await service.upgrade(
          'example-plugin',
          'client-controlled-version',
        );

        expect(
          plugins.upgrade,
        ).toHaveBeenCalledWith(
          'installed-plugin-id',
          {
            version:
              '3.1.0',
            notes:
              'Marketplace upgrade to 3.1.0',
          },
        );
      },
    );

    it(
      'rejects upgrade when the marketplace plugin is not installed',
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

        const versions = {
          details:
            jest.fn(
              async (
                _slug: string,
                _version: string,
              ) => ({
                version:
                  '2.0.0',
              }),
            ),
        };

        const plugins = {
          upgrade:
            jest.fn(),
        };

        const service =
          new MarketplaceUpgradeService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        await expect(
          service.upgrade(
            'example-plugin',
            '2.0.0',
          ),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          versions.details,
        ).not.toHaveBeenCalled();

        expect(
          plugins.upgrade,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
