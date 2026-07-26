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
  MarketplaceUninstallService,
} from '../services/marketplace-uninstall.service';
import {
  MarketplaceUninstallController,
} from './marketplace-uninstall.controller';

describe(
  'MarketplaceUninstallController',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            MarketplaceUninstallController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            MarketplaceUninstallController
              .prototype.uninstall,
          ),
        ).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'delegates only the marketplace slug',
      async () => {
        const service = {
          uninstall:
            jest.fn(
              async (
                slug: string,
              ) => ({
                slug,
                status:
                  'UNINSTALLED',
              }),
            ),
        };

        const controller =
          new MarketplaceUninstallController(
            service as unknown as
              MarketplaceUninstallService,
          );

        await controller.uninstall(
          'example-plugin',
        );

        expect(
          service.uninstall,
        ).toHaveBeenCalledWith(
          'example-plugin',
        );
      },
    );
  },
);
