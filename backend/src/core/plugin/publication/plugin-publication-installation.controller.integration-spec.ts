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
  PluginPublicationInstallationController,
} from './plugin-publication-installation.controller';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';

describe(
  'PluginPublicationInstallationController',
  () => {
    it(
      'requires JWT and plugin management permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            PluginPublicationInstallationController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            PluginPublicationInstallationController
              .prototype.install,
          ),
        ).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'derives the installation actor from the token',
      async () => {
        const installation = {
          install:
            jest.fn(
              async (input) =>
                input,
            ),
        };

        const controller =
          new PluginPublicationInstallationController(
            installation as unknown as
              PluginPublicationInstallationService,
          );

        await controller.install(
          '11111111-1111-4111-8111-111111111111',
          {
            autoEnable:
              true,
            metadata: {
              actorId:
                'attacker-controlled',
            },
            actorId:
              'attacker-controlled',
            storageObjectId:
              'attacker-controlled',
          } as any,
          {
            sub:
              'person-1',
          } as any,
        );

        expect(
          installation.install,
        ).toHaveBeenCalledWith({
          publicationId:
            '11111111-1111-4111-8111-111111111111',
          actorId:
            'person-1',
          autoEnable:
            true,
          overwrite:
            undefined,
          metadata: {
            actorId:
              'attacker-controlled',
          },
        });
      },
    );
  },
);
