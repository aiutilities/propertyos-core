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
  MarketplaceRollbackService,
} from '../services/marketplace-rollback.service';
import {
  MarketplaceRollbackController,
} from './marketplace-rollback.controller';

describe(
  'MarketplaceRollbackController',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            MarketplaceRollbackController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            MarketplaceRollbackController
              .prototype.rollback,
          ),
        ).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'delegates only slug, approved target version and notes',
      async () => {
        const service = {
          rollback:
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
          new MarketplaceRollbackController(
            service as unknown as
              MarketplaceRollbackService,
          );

        await controller.rollback(
          'example-plugin',
          '1.5.0',
          {
            notes:
              'Rollback approved',
          },
        );

        expect(
          service.rollback,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '1.5.0',
          'Rollback approved',
        );
      },
    );
  },
);
