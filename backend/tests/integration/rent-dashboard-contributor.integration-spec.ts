import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PluginDashboardRegistry,
} from '../../src/core/plugin/registries/plugin-dashboard.registry';
import {
  RentDashboardContributorService,
} from '../../src/core/rent/services/rent-dashboard-contributor.service';
import {
  RentService,
} from '../../src/core/rent/services/rent.service';

describe(
  'RentDashboardContributorService',
  () => {
    it(
      'registers itself for Rent',
      () => {
        const registry =
          new PluginDashboardRegistry();

        const rentService = {
          listRentLedgers:
            async () => [],
        };

        const contributor =
          new RentDashboardContributorService(
            registry,
            rentService as unknown as RentService,
          );

        contributor.onModuleInit();

        expect(
          registry.findByPlugin(
            'rent',
          ),
        ).toEqual([
          contributor,
        ]);
      },
    );

    it(
      'contributes current and outstanding Rent metrics',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const now = new Date();
        const currentYear =
          now.getFullYear();
        const currentMonth =
          now.getMonth() + 1;

        const rentService = {
          listRentLedgers:
            async () => [
              {
                periodYear:
                  currentYear,
                periodMonth:
                  currentMonth,
                rentAmount:
                  10000,
                amountPaid:
                  6000,
                balanceAmount:
                  4000,
              },
              {
                periodYear:
                  currentYear,
                periodMonth:
                  currentMonth,
                rentAmount:
                  5000,
                amountPaid:
                  5000,
                balanceAmount:
                  0,
              },
              {
                periodYear:
                  currentYear - 1,
                periodMonth:
                  currentMonth,
                rentAmount:
                  8000,
                amountPaid:
                  3000,
                balanceAmount:
                  5000,
              },
            ],
        };

        const contributor =
          new RentDashboardContributorService(
            registry,
            rentService as unknown as RentService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          rentLedgers: 3,
          currentMonthExpectedRent:
            15000,
          currentMonthCollectedRent:
            11000,
          outstandingRent:
            9000,
          collectionPercentage:
            73.33,
        });
      },
    );

    it(
      'returns a zero collection percentage without current Rent',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const rentService = {
          listRentLedgers:
            async () => [],
        };

        const contributor =
          new RentDashboardContributorService(
            registry,
            rentService as unknown as RentService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          rentLedgers: 0,
          currentMonthExpectedRent: 0,
          currentMonthCollectedRent: 0,
          outstandingRent: 0,
          collectionPercentage: 0,
        });
      },
    );
  },
);
