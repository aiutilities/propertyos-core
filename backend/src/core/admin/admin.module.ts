import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminMenuRegistry } from './registries/admin-menu.registry';
import { AdminWidgetRegistry } from './registries/admin-widget.registry';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
  exports: [AdminService, AdminMenuRegistry, AdminWidgetRegistry],
})
export class AdminModule {}
