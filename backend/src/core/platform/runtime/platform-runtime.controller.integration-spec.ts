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
} from '../../auth/constants/permissions';
import {
  REQUIRED_PERMISSION_KEY,
} from '../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';
import {
  PlatformRuntimeController,
} from './platform-runtime.controller';
import {
  PlatformRuntimeService,
} from './platform-runtime.service';

describe(
  'PlatformRuntimeController',
  () => {
    it(
      'requires JWT authentication and administrative read permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            PlatformRuntimeController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            PlatformRuntimeController
              .prototype.getRuntime,
          ),
        ).toBe(
          Permissions.ADMIN_READ,
        );
      },
    );

    it(
      'returns the standard success envelope',
      () => {
        const runtime = {
          publicContext:
            jest.fn(
              () => ({
                platformVersion:
                  '3.0.0',
                apiVersion:
                  '1.0.0',
                buildVersion:
                  '3.0.0-rc.1',
                environment:
                  'production',
              }),
            ),
        };

        const controller =
          new PlatformRuntimeController(
            runtime as unknown as
              PlatformRuntimeService,
          );

        expect(
          controller.getRuntime(),
        ).toEqual({
          success: true,
          data: {
            platformVersion:
              '3.0.0',
            apiVersion:
              '1.0.0',
            buildVersion:
              '3.0.0-rc.1',
            environment:
              'production',
          },
        });

        expect(
          runtime.publicContext,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'does not expose deployment diagnostics',
      () => {
        const runtime = {
          publicContext:
            () => ({
              platformVersion:
                '3.0.0',
              apiVersion:
                '1.0.0',
              buildVersion:
                '3.0.0',
              environment:
                'production',
            }),
        };

        const controller =
          new PlatformRuntimeController(
            runtime as unknown as
              PlatformRuntimeService,
          );

        const response =
          controller.getRuntime();

        expect(
          response.data,
        ).not.toHaveProperty(
          'gitSha',
        );

        expect(
          response.data,
        ).not.toHaveProperty(
          'nodeVersion',
        );

        expect(
          response.data,
        ).not.toHaveProperty(
          'operatingSystemRelease',
        );

        expect(
          response.data,
        ).not.toHaveProperty(
          'architecture',
        );
      },
    );
  },
);
