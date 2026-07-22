import {
  ExecutionContext,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Reflector } from '@nestjs/core';

import {
  PUBLIC_ROUTE_METADATA_KEY,
  Public,
} from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionGuard } from './permission.guard';

function context(options?: {
  authorization?: string;
  user?: {
    sub: string;
    email: string;
    exp: number;
  };
}): ExecutionContext {
  const request = {
    headers: {
      authorization: options?.authorization,
    },
    user: options?.user,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => function routeHandler() {},
    getClass: () => class RouteController {},
  } as unknown as ExecutionContext;
}

describe(
  'global authentication and authorization contract',
  () => {
    it(
      'uses an explicit auditable public metadata key',
      () => {
        expect(PUBLIC_ROUTE_METADATA_KEY).toBe(
          'propertyos.auth.public',
        );

        expect(Public).toEqual(
          expect.any(Function),
        );
      },
    );

    it(
      'allows only explicitly public routes without a token',
      () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(true),
        } as unknown as Reflector;

        const guard = new JwtAuthGuard(reflector);

        expect(guard.canActivate(context())).toBe(true);

        expect(
          reflector.getAllAndOverride,
        ).toHaveBeenCalledWith(
          PUBLIC_ROUTE_METADATA_KEY,
          expect.any(Array),
        );
      },
    );

    it(
      'rejects a protected route without a bearer token',
      () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(false),
        } as unknown as Reflector;

        const guard = new JwtAuthGuard(reflector);

        expect(() =>
          guard.canActivate(context()),
        ).toThrow('Missing bearer token');
      },
    );

    it(
      'rejects an invalid bearer token',
      () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(false),
        } as unknown as Reflector;

        const guard = new JwtAuthGuard(reflector);

        expect(() =>
          guard.canActivate(
            context({
              authorization:
                'Bearer invalid-token',
            }),
          ),
        ).toThrow('Invalid token');
      },
    );

    it(
      'allows routes without permission metadata after authentication',
      async () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(undefined),
        } as unknown as Reflector;

        const identityService = {
          listPersonRoles: jest.fn(),
          listRolePermissions: jest.fn(),
        };

        const guard = new PermissionGuard(
          reflector,
          identityService as never,
        );

        await expect(
          guard.canActivate(
            context({
              user: {
                sub: 'person-1',
                email: 'admin@propertyos.test',
                exp:
                  Math.floor(Date.now() / 1000)
                  + 3600,
              },
            }),
          ),
        ).resolves.toBe(true);

        expect(
          identityService.listPersonRoles,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects permission metadata without user context',
      async () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(
              'property.read',
            ),
        } as unknown as Reflector;

        const identityService = {
          listPersonRoles: jest.fn(),
          listRolePermissions: jest.fn(),
        };

        const guard = new PermissionGuard(
          reflector,
          identityService as never,
        );

        await expect(
          guard.canActivate(context()),
        ).rejects.toThrow(
          'User context missing',
        );
      },
    );

    it(
      'rejects an authenticated user without the required permission',
      async () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(
              'property.read',
            ),
        } as unknown as Reflector;

        const identityService = {
          listPersonRoles:
            jest
              .fn<
                () => Promise<
                  Array<{
                    id: string;
                  }>
                >
              >()
              .mockResolvedValue([
                {
                  id: 'role-1',
                },
              ]),
          listRolePermissions:
            jest
              .fn<
                () => Promise<
                  Array<{
                    key: string;
                  }>
                >
              >()
              .mockResolvedValue([
                {
                  key: 'property.create',
                },
              ]),
        };

        const guard = new PermissionGuard(
          reflector,
          identityService as never,
        );

        await expect(
          guard.canActivate(
            context({
              user: {
                sub: 'person-1',
                email: 'admin@propertyos.test',
                exp:
                  Math.floor(Date.now() / 1000)
                  + 3600,
              },
            }),
          ),
        ).rejects.toThrow(
          'Permission denied',
        );
      },
    );

    it(
      'allows an authenticated user with the required permission',
      async () => {
        const reflector = {
          getAllAndOverride:
            jest.fn().mockReturnValue(
              'property.read',
            ),
        } as unknown as Reflector;

        const identityService = {
          listPersonRoles:
            jest
              .fn<
                () => Promise<
                  Array<{
                    id: string;
                  }>
                >
              >()
              .mockResolvedValue([
                {
                  id: 'role-1',
                },
              ]),
          listRolePermissions:
            jest
              .fn<
                () => Promise<
                  Array<{
                    key: string;
                  }>
                >
              >()
              .mockResolvedValue([
                {
                  key: 'property.read',
                },
              ]),
        };

        const guard = new PermissionGuard(
          reflector,
          identityService as never,
        );

        await expect(
          guard.canActivate(
            context({
              user: {
                sub: 'person-1',
                email: 'admin@propertyos.test',
                exp:
                  Math.floor(Date.now() / 1000)
                  + 3600,
              },
            }),
          ),
        ).resolves.toBe(true);
      },
    );
  },
);
