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
  PluginPublicationGovernanceController,
} from './plugin-publication-governance.controller';

describe(
  'PluginPublicationGovernanceController security boundary',
  () => {
    it(
      'requires JWT authentication and plugin management permission on every operation',
      () => {
        const guards =
          Reflect.getMetadata(
            GUARDS_METADATA,
            PluginPublicationGovernanceController,
          );

        expect(guards).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        for (
          const method of [
            'submit',
            'transition',
            'events',
            'get',
          ] as const
        ) {
          expect(
            Reflect.getMetadata(
              REQUIRED_PERMISSION_KEY,
              PluginPublicationGovernanceController
                .prototype[method],
            ),
          ).toBe(
            Permissions.PLUGIN_MANAGE,
          );
        }
      },
    );

    it(
      'derives submitter identity from the authenticated token',
      async () => {
        const admit =
          jest.fn(
            async (
              input: unknown,
            ) => input,
          );

        const controller =
          new PluginPublicationGovernanceController(
            {
              admit,
            } as never,
            {} as never,
          );

        const result =
          await controller.submit(
            {
              storageObjectId:
                '22222222-2222-4222-8222-222222222222',
              metadata: {
                channel:
                  'stable',
              },
              actorId:
                'attacker',
              artifactSha256:
                'f'.repeat(64),
              publisherId:
                'attacker',
            } as never,
            {
              sub:
                'authenticated-person',
              email:
                'admin@propertyos.test',
              displayName:
                'Admin',
              iat:
                1,
              exp:
                2,
            },
          );

        expect(admit).toHaveBeenCalledWith({
          storageObjectId:
            '22222222-2222-4222-8222-222222222222',
          metadata: {
            channel:
              'stable',
          },
          actorId:
            'authenticated-person',
        });

        expect(result).not.toHaveProperty(
          'publisherId',
        );
        expect(result).not.toHaveProperty(
          'artifactSha256',
        );
      },
    );

    it(
      'derives reviewer identity and drops injected actor fields',
      async () => {
        const transition =
          jest.fn(
            async (
              input: unknown,
            ) => input,
          );

        const controller =
          new PluginPublicationGovernanceController(
            {} as never,
            {
              transition,
            } as never,
          );

        await controller.transition(
          '11111111-1111-4111-8111-111111111111',
          {
            targetStatus:
              'APPROVED',
            reason:
              'Security review passed',
            metadata: {
              ticket:
                'SEC-100',
            },
            actorId:
              'attacker',
            reviewedBy:
              'attacker',
          } as never,
          {
            sub:
              'authenticated-reviewer',
            email:
              'reviewer@propertyos.test',
            displayName:
              'Reviewer',
            iat:
              1,
            exp:
              2,
          },
        );

        expect(
          transition,
        ).toHaveBeenCalledWith({
          publicationId:
            '11111111-1111-4111-8111-111111111111',
          targetStatus:
            'APPROVED',
          reason:
            'Security review passed',
          metadata: {
            ticket:
              'SEC-100',
          },
          actorId:
            'authenticated-reviewer',
        });
      },
    );
  },
);
