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
  REQUIRED_PERMISSION_KEY,
} from '../../auth/decorators/require-permission.decorator';
import {
  Permissions,
} from '../../auth/constants/permissions';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';
import {
  PluginPublisherTrustController,
} from './plugin-publisher-trust.controller';
import {
  PluginPublisherTrustLifecycleService,
} from './plugin-publisher-trust-lifecycle.service';

describe(
  'PluginPublisherTrustController security boundary',
  () => {
    it(
      'requires JWT authentication and plugin management permission',
      () => {
        const guards =
          Reflect.getMetadata(
            GUARDS_METADATA,
            PluginPublisherTrustController,
          );

        expect(guards).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        const permission =
          Reflect.getMetadata(
            REQUIRED_PERMISSION_KEY,
            PluginPublisherTrustController
              .prototype
              .revokeKey,
          );

        expect(permission).toBe(
          Permissions.PLUGIN_MANAGE,
        );
      },
    );

    it(
      'derives the actor from the token and drops injected actor fields',
      async () => {
        const lifecycle = {
          revokeKey:
            jest.fn(
              async (input) => input,
            ),
        };

        const controller =
          new PluginPublisherTrustController(
            lifecycle as unknown as
              PluginPublisherTrustLifecycleService,
          );

        const result =
          await controller.revokeKey(
            'propertyos',
            'release-2026',
            {
              reason:
                'Private key compromise',
              metadata: {
                incidentId:
                  'incident-42',
                actorId:
                  'attacker-controlled',
              },
              actorId:
                'attacker-controlled',
            } as any,
            {
              sub:
                'security-person-1',
            } as any,
          );

        expect(
          lifecycle.revokeKey,
        ).toHaveBeenCalledWith({
          publisherId:
            'propertyos',
          keyId:
            'release-2026',
          actorId:
            'security-person-1',
          reason:
            'Private key compromise',
          metadata: {
            incidentId:
              'incident-42',
            actorId:
              'attacker-controlled',
          },
        });

        expect(result).toEqual(
          expect.objectContaining({
            actorId:
              'security-person-1',
          }),
        );
      },
    );
  },
);
