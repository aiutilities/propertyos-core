import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PluginDashboardContributor,
  PluginDashboardMetrics,
  PluginDashboardRegistry,
} from '@propertyos/core-contracts';
import { InvoiceService } from './invoice.service';

@Injectable()
export class InvoiceDashboardContributorService
  implements
    PluginDashboardContributor,
    OnModuleInit
{
  constructor(
    private readonly registry:
      PluginDashboardRegistry,
    private readonly invoiceService:
      InvoiceService,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      'invoice',
      [this],
    );
  }

  async contribute():
    Promise<PluginDashboardMetrics> {
    const invoices =
      await this.invoiceService
        .findAll();

    return {
      invoices:
        invoices.length,
      overdueInvoices:
        invoices.filter(
          (invoice) =>
            invoice.status ===
            'OVERDUE',
        ).length,
    };
  }
}
