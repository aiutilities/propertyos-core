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
          'agreement',
          [
            {
              contribute:
                async () => ({
                  activeLeases: 1,
                }),
            },
          ],
        );

        dashboardRegistry.register(
          'tenant',
          [
            {
              contribute:
                async () => ({
                  tenants: 2,
                  activeTenants: 4,
                  occupiedSpaces: 6,
                }),
            },
          ],
        );

        dashboardRegistry.register(
          'rent',
          [
            {
              contribute:
                async () => ({
                  rentLedgers: 4,
                  currentMonthExpectedRent:
                    20000,
                  currentMonthCollectedRent:
                    15000,
                  outstandingRent:
                    7000,
                  collectionPercentage:
                    75,
                }),
            },
          ],
        );

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

        dashboardRegistry.register(
          'invoice',
          [
            {
              contribute:
                async () => ({
                  invoices: 5,
                  overdueInvoices: 2,
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
          );

        const dashboard =
          await service.getDashboard();

        expect(
          dashboard.business.rentLedgers,
        ).toBe(4);

        expect(
          dashboard.business
            .currentMonthExpectedRent,
        ).toBe(20000);

        expect(
          dashboard.business
            .currentMonthCollectedRent,
        ).toBe(15000);

        expect(
          dashboard.business.outstandingRent,
        ).toBe(7000);

        expect(
          dashboard.business
            .collectionPercentage,
        ).toBe(75);

        expect(
          dashboard.business.receipts,
        ).toBe(7);

        expect(
          dashboard.business.invoices,
        ).toBe(5);

        expect(
          dashboard.business.overdueInvoices,
        ).toBe(2);

        expect(
          dashboard.business.occupiedSpaces,
        ).toBe(6);

        expect(
          dashboard.business.vacantSpaces,
        ).toBe(4);

        expect(
          dashboard.business
            .occupancyPercentage,
        ).toBe(60);

        expect(
          dashboard.business.activeTenants,
        ).toBe(4);

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
