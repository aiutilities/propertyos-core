import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import * as hostContracts from './core-contracts';
import {
  CORE_CONTRACTS_HOST_API_VERSION,
  CORE_CONTRACTS_HOST_RUNTIME_KEY,
  registerCoreContractsHostRuntime,
  resolveCoreContractsHostRuntime,
} from './core-contracts-host-runtime';

type HostRuntimeScope = typeof globalThis & {
  [CORE_CONTRACTS_HOST_RUNTIME_KEY]?:
    Readonly<Record<string, unknown>>;
};

const scope = globalThis as HostRuntimeScope;

describe(
  'Core contracts host runtime registration',
  () => {
    afterEach(() => {
      delete scope[
        CORE_CONTRACTS_HOST_RUNTIME_KEY
      ];
    });

    it(
      'registers the complete host contract facade',
      () => {
        const registration =
          registerCoreContractsHostRuntime();

        expect(registration.registered)
          .toBe(true);

        expect(
          registration.hostApiVersion,
        ).toBe(
          CORE_CONTRACTS_HOST_API_VERSION,
        );

        expect(
          resolveCoreContractsHostRuntime(),
        ).toBe(hostContracts);

        expect(
          Object.keys(
            registration.runtime,
          ).sort(),
        ).toEqual(
          Object.keys(hostContracts).sort(),
        );
      },
    );

    it(
      'uses the portable package symbol key',
      () => {
        registerCoreContractsHostRuntime();

        expect(
          Symbol.keyFor(
            CORE_CONTRACTS_HOST_RUNTIME_KEY,
          ),
        ).toBe(
          '@propertyos/core-contracts/' +
            'host-runtime',
        );
      },
    );

    it(
      'is idempotent for the same host facade',
      () => {
        const first =
          registerCoreContractsHostRuntime();

        const second =
          registerCoreContractsHostRuntime();

        expect(first.registered).toBe(true);
        expect(second.registered).toBe(false);
        expect(second.runtime).toBe(
          first.runtime,
        );
      },
    );

    it(
      'rejects a conflicting host provider',
      () => {
        Object.defineProperty(
          scope,
          CORE_CONTRACTS_HOST_RUNTIME_KEY,
          {
            configurable: true,
            value: {
              conflicting: true,
            },
          },
        );

        expect(
          () =>
            registerCoreContractsHostRuntime(),
        ).toThrow(
          'already registered by a different ' +
            'provider',
        );
      },
    );

    it(
      'exposes approved runtime symbols',
      () => {
        const registration =
          registerCoreContractsHostRuntime();

        const requiredSymbols = [
          'AuditModule',
          'AuditService',
          'AuthModule',
          'JwtAuthGuard',
          'PermissionGuard',
          'Permissions',
          'RequirePermission',
          'DatabaseModule',
          'POSTGRES_POOL',
          'PostgresModule',
          'EventBusModule',
          'EventBusService',
          'IdentityModule',
          'BasePostgresRepository',
          'PaginationQueryDto',
          'normalizePagination',
          'PluginDashboardRegistry',
          'PluginModule',
          'PluginNotificationRegistry',
          'PluginPermissionRegistry',
          'PluginWorkflowRegistry',
          'REPORT_EXPORT_JOB_TYPE',
          'SchedulerHandlerRegistry',
          'SchedulerModule',
          'SchedulerService',
          'SearchModule',
          'SearchProviderRegistry',
          'WorkflowModule',
          'WorkflowService',
        ];

        for (const symbol of requiredSymbols) {
          expect(
            registration.runtime[symbol],
          ).toBeDefined();
        }
      },
    );
  },
);
