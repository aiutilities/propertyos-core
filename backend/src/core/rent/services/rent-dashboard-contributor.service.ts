import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PluginDashboardContributor,
  PluginDashboardMetrics,
  PluginDashboardRegistry,
} from '../../plugin/registries/plugin-dashboard.registry';
import { RentService } from './rent.service';

@Injectable()
export class RentDashboardContributorService
  implements
    PluginDashboardContributor,
    OnModuleInit
{
  constructor(
    private readonly registry:
      PluginDashboardRegistry,
    private readonly rentService:
      RentService,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      'rent',
      [this],
    );
  }

  async contribute():
    Promise<PluginDashboardMetrics> {
    const rentLedgers =
      await this.rentService
        .listRentLedgers();

    const now = new Date();
    const currentYear =
      now.getFullYear();
    const currentMonth =
      now.getMonth() + 1;

    const currentMonthLedgers =
      rentLedgers.filter(
        (ledger) =>
          ledger.periodYear ===
            currentYear &&
          ledger.periodMonth ===
            currentMonth,
      );

    const currentMonthExpectedRent =
      currentMonthLedgers.reduce(
        (total, ledger) =>
          total +
          Number(
            ledger.rentAmount ??
              0,
          ),
        0,
      );

    const currentMonthCollectedRent =
      currentMonthLedgers.reduce(
        (total, ledger) =>
          total +
          Number(
            ledger.amountPaid ??
              0,
          ),
        0,
      );

    const outstandingRent =
      rentLedgers.reduce(
        (total, ledger) =>
          total +
          Number(
            ledger.balanceAmount ??
              0,
          ),
        0,
      );

    const collectionPercentage =
      currentMonthExpectedRent > 0
        ? Number(
            (
              (
                currentMonthCollectedRent /
                currentMonthExpectedRent
              ) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      rentLedgers:
        rentLedgers.length,
      currentMonthExpectedRent,
      currentMonthCollectedRent,
      outstandingRent,
      collectionPercentage,
    };
  }
}
