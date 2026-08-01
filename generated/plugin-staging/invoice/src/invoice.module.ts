import { Module } from '@nestjs/common';
import { DatabaseModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { InvoiceController } from './controllers/invoice.controller';
import { INVOICE_REPOSITORY } from './repositories/invoice-repository.interface';
import { PostgresInvoiceRepository } from './repositories/postgres-invoice.repository';
import { InvoiceService } from './services/invoice.service';
import { InvoiceDashboardContributorService } from './services/invoice-dashboard-contributor.service';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    PluginModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceDashboardContributorService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: PostgresInvoiceRepository,
    },
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
