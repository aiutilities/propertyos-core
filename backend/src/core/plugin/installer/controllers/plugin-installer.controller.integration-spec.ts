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
  PluginInstallerController,
} from './plugin-installer.controller';

describe(
  'PluginInstallerController security boundary',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        const guards =
          Reflect.getMetadata(
            GUARDS_METADATA,
            PluginInstallerController,
          );

        expect(guards).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        const permission =
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            PluginInstallerController
              .prototype
              .install,
          );

        expect(permission).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'reconstructs the trusted request and drops injected package paths',
      async () => {
        const install =
          jest.fn(
            async (
              request: unknown,
            ) => request,
          );

        const controller =
          new PluginInstallerController({
            install,
          } as never);

        const result =
          await controller.install({
            storageObjectId:
              'storage-object-1',
            autoEnable:
              false,
            overwrite:
              true,
            metadata: {
              source:
                'admin-ui',
            },
            packagePath:
              '/etc/passwd',
          } as never);

        expect(install).toHaveBeenCalledWith({
          storageObjectId:
            'storage-object-1',
          autoEnable:
            false,
          overwrite:
            true,
          metadata: {
            source:
              'admin-ui',
          },
        });

        expect(result).not.toHaveProperty(
          'packagePath',
        );
      },
    );
  },
);
