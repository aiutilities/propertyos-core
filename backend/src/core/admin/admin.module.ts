import { Module } from '@nestjs/common';

import { AgreementModule } from '../agreement/agreement.module';
import { PluginModule } from '../plugin/plugin.module';
import { PropertyModule } from '../property/property.module';
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
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
  exports: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
})
export class AdminModule {}
