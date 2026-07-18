import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AdminService,
} from '../../src/core/admin/services/admin.service';
import {
  PluginDashboardRegistry,
} from '../../src/core/plugin/registries/plugin-dashboard.registry';

describe(
  'Admin dashboard plugin contributions',
  () => {
    it(
      'uses Receipt metrics from the plugin registry',
      async () => {
        const dashboardRegistry =
          new PluginDashboardRegistry();

        dashboardRegistry.register(
          'receipt',
          [
            {
              contribute:
                async () => ({
                  receipts: 7,
                }),
            },
          ],
        );

        const listRegistry = {
          list: () => [],
        };

        const menuRegistry = {
          list: () => [],
          register: () => undefined,
        };

        const widgetRegistry = {
          list: () => [],
          register: () => undefined,
        };

        const service =
          new AdminService(
            menuRegistry as never,
            widgetRegistry as never,
            {
              list:
                async () => [],
            } as never,
            listRegistry as never,
            listRegistry as never,
            listRegistry as never,
            listRegistry as never,
            listRegistry as never,
            listRegistry as never,
            listRegistry as never,
            dashboardRegistry,
            {
              getPortfolioCounts:
                async () => ({
                  properties: 2,
                  zones: 3,
                  spaces: 10,
                }),
            } as never,
            {
              getOccupancyCounts:
                async () => ({
                  occupiedSpaces: 6,
                  activeTenants: 4,
                }),
              listTenants:
                async () => [
                  {},
                  {},
                ],
            } as never,
            {
              listAgreements:
                async () => [
                  {
                    status: 'ACTIVE',
                  },
                ],
            } as never,
            {
              listRentLedgers:
                async () => [],
            } as never,
            {
              findAll:
                async () => [],
            } as never,
          );

        const dashboard =
          await service.getDashboard();

        expect(
          dashboard.business.receipts,
        ).toBe(7);

        expect(
          dashboard.business.invoices,
        ).toBe(0);

        expect(
          dashboard.business.tenants,
        ).toBe(2);

        expect(
          dashboard.business.activeLeases,
        ).toBe(1);
      },
    );
  },
);
