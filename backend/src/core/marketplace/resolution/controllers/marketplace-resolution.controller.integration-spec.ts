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
  MarketplaceResolutionPlannerService,
} from '../services/marketplace-resolution-planner.service';
import {
  MarketplaceResolutionController,
} from './marketplace-resolution.controller';

describe(
  'MarketplaceResolutionController',
  () => {
    it(
      'requires JWT authentication and plugin read permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            MarketplaceResolutionController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            MarketplaceResolutionController
              .prototype.resolution,
          ),
        ).toBe(
          Permissions.PLUGIN_READ,
        );
      },
    );

    it(
      'delegates slug and version without executing lifecycle operations',
      async () => {
        const planner = {
          plan:
            jest.fn(
              async (
                slug: string,
                version: string,
              ) => ({
                slug,
                version,
                executable:
                  true,
              }),
            ),
        };

        const controller =
          new MarketplaceResolutionController(
            planner as unknown as
              MarketplaceResolutionPlannerService,
          );

        await controller.resolution(
          'example-plugin',
          '2.0.0',
        );

        expect(
          planner.plan,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '2.0.0',
        );
      },
    );
  },
);
