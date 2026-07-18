import { Module } from '@nestjs/common';

import { PluginModule } from '../plugin/plugin.module';
import { PropertyModule } from '../property/property.module';
import { AdminController } from './controllers/admin.controller';
import { AdminMenuRegistry } from './registries/admin-menu.registry';
import { AdminWidgetRegistry } from './registries/admin-widget.registry';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    PluginModule,
    PropertyModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
  exports: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
})
export class AdminModule {}
