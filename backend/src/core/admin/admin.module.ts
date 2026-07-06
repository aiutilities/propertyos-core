import { Module } from '@nestjs/common';
import { PluginModule } from '../plugin/plugin.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminMenuRegistry } from './registries/admin-menu.registry';
import { AdminWidgetRegistry } from './registries/admin-widget.registry';

@Module({
  imports: [PluginModule],
  controllers: [AdminController],
  providers: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
  exports: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
})
export class AdminModule {}
