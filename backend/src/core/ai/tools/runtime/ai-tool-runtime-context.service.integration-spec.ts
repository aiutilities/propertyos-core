import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  IdentityService,
} from '../../../identity/services/identity.service';
import {
  AiToolRuntimeContextService,
} from './ai-tool-runtime-context.service';

describe(
  'AiToolRuntimeContextService',
  () => {
    function createService() {
      const identity = {
        listPersonRoles:
          jest.fn(
            async (
              _actorId: string,
            ) => [
              {
                id: 'role-2',
              },
              {
                id: 'role-1',
              },
            ],
          ),
        listRolePermissions:
          jest.fn(
            async (
              roleId: string,
            ) =>
              roleId === 'role-1'
                ? [
                    {
                      key:
                        'property.read',
                    },
                    {
                      key:
                        'ai.tool.execute',
                    },
                  ]
                : [
                    {
                      key:
                        'property.read',
                    },
                    {
                      key:
                        'maintenance.read',
                    },
                  ],
          ),
      };

      return {
        identity,
        service:
          new AiToolRuntimeContextService(
            identity as unknown as
              IdentityService,
          ),
      };
    }

    it(
      'resolves a trusted actor and complete deduplicated permission set',
      async () => {
        const {
          identity,
          service,
        } = createService();

        const result =
          await service.create({
            user: {
              sub: ' actor-1 ',
              email:
                'actor@example.com',
              displayName:
                'Actor One',
              iat:
                1_900_000_000,
              exp:
                2_000_000_000,
            },
            correlationId:
              ' correlation-1 ',
            propertyId:
              ' property-1 ',
            conversationId:
              ' conversation-1 ',
          });

        expect(result).toEqual({
          actorId:
            'actor-1',
          correlationId:
            'correlation-1',
          permissions: [
            'ai.tool.execute',
            'maintenance.read',
            'property.read',
          ],
          propertyId:
            'property-1',
          conversationId:
            'conversation-1',
        });

        expect(
          identity.listPersonRoles,
        ).toHaveBeenCalledWith(
          'actor-1',
        );

        expect(
          identity
            .listRolePermissions,
        ).toHaveBeenCalledTimes(
          2,
        );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            result.permissions,
          ),
        ).toBe(true);
      },
    );

    it(
      'supports an authenticated actor with no assigned permissions',
      async () => {
        const identity = {
          listPersonRoles:
            jest.fn(
              async (
                _actorId: string,
              ) => [],
            ),
          listRolePermissions:
            jest.fn(),
        };

        const service =
          new AiToolRuntimeContextService(
            identity as unknown as
              IdentityService,
          );

        await expect(
          service.create({
            user: {
              sub: 'actor-empty',
              email:
                'empty@example.com',
              displayName:
                'Empty Actor',
              iat:
                1_900_000_000,
              exp:
                2_000_000_000,
            },
            correlationId:
              'correlation-empty',
          }),
        ).resolves.toEqual({
          actorId:
            'actor-empty',
          correlationId:
            'correlation-empty',
          permissions: [],
        });

        expect(
          identity
            .listRolePermissions,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a missing authenticated actor',
      async () => {
        const {
          service,
        } = createService();

        await expect(
          service.create({
            user: {
              sub: ' ',
              email:
                'invalid@example.com',
              displayName:
                'Invalid Actor',
              iat:
                1_900_000_000,
              exp:
                2_000_000_000,
            },
            correlationId:
              'correlation-invalid',
          }),
        ).rejects.toThrow(
          'Authenticated actor is required for AI tool execution',
        );
      },
    );

    it(
      'rejects a missing correlation identity',
      async () => {
        const {
          service,
        } = createService();

        await expect(
          service.create({
            user: {
              sub: 'actor-1',
              email:
                'actor@example.com',
              displayName:
                'Actor One',
              iat:
                1_900_000_000,
              exp:
                2_000_000_000,
            },
            correlationId:
              ' ',
          }),
        ).rejects.toThrow(
          'Correlation ID is required for AI tool execution',
        );
      },
    );
  },
);
