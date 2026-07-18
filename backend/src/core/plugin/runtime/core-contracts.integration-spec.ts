import { describe, expect, it } from '@jest/globals';

describe(
  '@propertyos/core-contracts runtime bridge',
  () => {
    it(
      'exports required host runtime symbols',
      () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const contract = require(
          '@propertyos/core-contracts',
        );

        const symbols = [
          'AuditModule',
          'AuditService',
          'AuthModule',
          'Permissions',
          'RequirePermission',
          'JwtAuthGuard',
          'PermissionGuard',
          'DatabaseModule',
          'PostgresModule',
          'POSTGRES_POOL',
          'EventBusModule',
          'EventBusService',
          'IdentityModule',
          'PaginationQueryDto',
          'normalizePagination',
          'BasePostgresRepository',
          'PluginModule',
          'PluginNotificationRegistry',
          'PluginDashboardRegistry',
          'PluginPermissionRegistry',
          'PluginWorkflowRegistry',
          'SchedulerHandlerRegistry',
          'SchedulerModule',
          'SchedulerService',
          'REPORT_EXPORT_JOB_TYPE',
          'SearchProviderRegistry',
          'SearchModule',
          'WorkflowService',
          'WorkflowModule',
        ];

        for (const symbol of symbols) {
          expect(
            contract[symbol],
          ).toBeDefined();
        }
      },
    );

    it(
      'uses the host implementations',
      () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const contract = require(
          '@propertyos/core-contracts',
        );

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const audit = require(
          '../../audit/audit.service',
        );

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const eventbus = require(
          '../../eventbus/services/eventbus.service',
        );

        expect(
          contract.AuditService,
        ).toBe(audit.AuditService);

        expect(
          contract.EventBusService,
        ).toBe(eventbus.EventBusService);
      },
    );
  },
);
