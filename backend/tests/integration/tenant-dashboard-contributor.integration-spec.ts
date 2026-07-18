import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PluginDashboardRegistry,
} from '../../src/core/plugin/registries/plugin-dashboard.registry';
import {
  TenantDashboardContributorService,
} from '../../src/core/tenant/services/tenant-dashboard-contributor.service';
import {
  TenantService,
} from '../../src/core/tenant/services/tenant.service';

describe(
  'TenantDashboardContributorService',
  () => {
    it(
      'registers itself for Tenant',
      () => {
        const registry =
          new PluginDashboardRegistry();

        const tenantService = {
          listTenants:
            async () => [],
          getOccupancyCounts:
            async () => ({
              activeTenants: 0,
              occupiedSpaces: 0,
            }),
        };

        const contributor =
          new TenantDashboardContributorService(
            registry,
            tenantService as unknown as TenantService,
          );

        contributor.onModuleInit();

        expect(
          registry.findByPlugin(
            'tenant',
          ),
        ).toEqual([
          contributor,
        ]);
      },
    );

    it(
      'contributes Tenant and occupancy metrics',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const tenantService = {
          listTenants:
            async () => [
              {} as never,
              {} as never,
              {} as never,
            ],
          getOccupancyCounts:
            async () => ({
              activeTenants: 2,
              occupiedSpaces: 4,
            }),
        };

        const contributor =
          new TenantDashboardContributorService(
            registry,
            tenantService as unknown as TenantService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          tenants: 3,
          activeTenants: 2,
          occupiedSpaces: 4,
        });
      },
    );
  },
);
