import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PluginController } from './controllers/plugin.controller';
import { PluginService } from './services/plugin.service';
import { PostgresPluginRepository } from './repositories/postgres-plugin.repository';
import { PluginRegistry } from './sdk/plugin-registry';
import { PluginLoader } from './sdk/plugin-loader';
import { PluginManager } from './sdk/plugin-manager';
import { HookManager } from './sdk/hook-manager';
import { ExtensionRegistry } from './sdk/extension-registry';
import { PluginLifecycleService } from './lifecycle/plugin-lifecycle.service';

@Module({
  imports: [EventBusModule],
  controllers: [PluginController],
  providers: [
    PluginService,
    PostgresPluginRepository,
    PluginRegistry,
    PluginLoader,
    PluginManager,
    HookManager,
    ExtensionRegistry,
    PluginLifecycleService,
  ],
  exports: [PluginService],
})
export class PluginModule {}
