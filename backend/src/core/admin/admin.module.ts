import { Module } from '@nestjs/common';

import { AgreementModule } from '../agreement/agreement.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { PluginModule } from '../plugin/plugin.module';
import { PropertyModule } from '../property/property.module';
import { ReceiptModule } from '../receipt/receipt.module';
import { RentModule } from '../rent/rent.module';
import { TenantModule } from '../tenant/tenant.module';
import { AdminController } from './controllers/admin.controller';
import { AdminMenuRegistry } from './registries/admin-menu.registry';
import { AdminWidgetRegistry } from './registries/admin-widget.registry';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    PluginModule,
    PropertyModule,
    TenantModule,
    AgreementModule,
    RentModule,
    ReceiptModule,
    InvoiceModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
  exports: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
})
export class AdminModule {}
