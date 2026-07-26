import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  GUARDS_METADATA,
} from '@nestjs/common/constants';

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
  MarketplaceInstallController,
} from './marketplace-install.controller';
import {
  MarketplaceInstallService,
} from '../services/marketplace-install.service';

describe(
  'MarketplaceInstallController',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            MarketplaceInstallController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            MarketplaceInstallController
              .prototype.install,
          ),
        ).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'derives the actor from the authenticated token',
      async () => {
        const service = {
          install:
            jest.fn(async (...args) => args),
        };

        const controller =
          new MarketplaceInstallController(
            service as unknown as
              MarketplaceInstallService,
          );

        await controller.install(
          'example-plugin',
          '1.0.0',
          {
            autoEnable: true,
            overwrite: false,
            metadata: {
              actorId:
                'attacker-controlled',
            },
            actorId:
              'attacker-controlled',
            publicationId:
              'attacker-controlled',
          } as any,
          {
            sub:
              'authenticated-person',
          } as any,
        );

        expect(
          service.install,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '1.0.0',
          'authenticated-person',
          true,
          false,
          {
            actorId:
              'attacker-controlled',
          },
        );
      },
    );
  },
);
