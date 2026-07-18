import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PluginDashboardContributor,
  PluginDashboardMetrics,
  PluginDashboardRegistry,
} from '../../plugin/registries/plugin-dashboard.registry';
import { ReceiptService } from './receipt.service';

@Injectable()
export class ReceiptDashboardContributorService
  implements
    PluginDashboardContributor,
    OnModuleInit
{
  constructor(
    private readonly registry:
      PluginDashboardRegistry,
    private readonly receiptService:
      ReceiptService,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      'receipt',
      [this],
    );
  }

  async contribute():
    Promise<PluginDashboardMetrics> {
    const receipts =
      await this.receiptService
        .findAll();

    return {
      receipts:
        receipts.length,
    };
  }
}
