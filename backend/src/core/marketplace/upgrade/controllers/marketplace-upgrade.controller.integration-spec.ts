import {
  GUARDS_METADATA,
} from '@nestjs/common/constants';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  Permissions,
} from '../../../auth/constants/permissions';
import {
  REQUIRED_PERMISSION_KEY,
} from '../../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../../auth/guards/permission.guard';
import {
  MarketplaceUpgradeService,
} from '../services/marketplace-upgrade.service';
import {
  MarketplaceUpgradeController,
} from './marketplace-upgrade.controller';

describe(
  'MarketplaceUpgradeController',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            MarketplaceUpgradeController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            MarketplaceUpgradeController
              .prototype.upgrade,
          ),
        ).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'delegates only the slug, version and optional notes',
      async () => {
        const service = {
          upgrade:
            jest.fn(
              async (
                slug: string,
                version: string,
                notes?: string,
              ) => ({
                slug,
                version,
                notes,
              }),
            ),
        };

        const controller =
          new MarketplaceUpgradeController(
            service as unknown as
              MarketplaceUpgradeService,
          );

        await controller.upgrade(
          'example-plugin',
          '2.0.0',
          {
            notes:
              'Upgrade approved',
          },
        );

        expect(
          service.upgrade,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '2.0.0',
          'Upgrade approved',
        );
      },
    );
  },
);
