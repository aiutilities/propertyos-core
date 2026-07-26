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
  MarketplaceRollbackService,
} from './marketplace-rollback.service';

describe(
  'MarketplaceRollbackService',
  () => {
    it(
      'resolves an approved release and delegates rollback to PluginService',
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
                publicationId:
                  'approved-publication-id',
                version:
                  '1.5.0',
              }),
            ),
        };

        const plugins = {
          rollback:
            jest.fn(
              async (
                _id: string,
                dto: {
                  targetVersion: string;
                  notes?: string;
                },
              ) => ({
                success: true,
                status:
                  'ROLLED_BACK',
                fromVersion:
                  '2.0.0',
                toVersion:
                  dto.targetVersion,
              }),
            ),
        };

        const service =
          new MarketplaceRollbackService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        const result =
          await service.rollback(
            'example-plugin',
            '1.5.0',
            'Approved rollback',
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
          '1.5.0',
        );

        expect(
          plugins.rollback,
        ).toHaveBeenCalledWith(
          'installed-plugin-id',
          {
            targetVersion:
              '1.5.0',
            notes:
              'Approved rollback',
          },
        );

        expect(result).toMatchObject({
          success: true,
          status:
            'ROLLED_BACK',
          fromVersion:
            '2.0.0',
          toVersion:
            '1.5.0',
        });
      },
    );

    it(
      'uses the approved projected version rather than client provenance',
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
                  '1.2.0',
              }),
            ),
        };

        const plugins = {
          rollback:
            jest.fn(
              async (
                _id: string,
                dto: {
                  targetVersion: string;
                  notes?: string;
                },
              ) => dto,
            ),
        };

        const service =
          new MarketplaceRollbackService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        await service.rollback(
          'example-plugin',
          'client-controlled-version',
        );

        expect(
          plugins.rollback,
        ).toHaveBeenCalledWith(
          'installed-plugin-id',
          {
            targetVersion:
              '1.2.0',
            notes:
              'Marketplace rollback to 1.2.0',
          },
        );
      },
    );

    it(
      'rejects rollback when the marketplace plugin is not installed',
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
            jest.fn(),
        };

        const plugins = {
          rollback:
            jest.fn(),
        };

        const service =
          new MarketplaceRollbackService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            plugins as unknown as
              PluginService,
          );

        await expect(
          service.rollback(
            'example-plugin',
            '1.0.0',
          ),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          versions.details,
        ).not.toHaveBeenCalled();

        expect(
          plugins.rollback,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
