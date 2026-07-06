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
import { PluginLoaderService } from './loader/plugin-loader.service';
import { PluginWorkflowRegistry } from './registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from './registries/plugin-permission.registry';
import { PluginNotificationRegistry } from './registries/plugin-notification.registry';
import { PluginDocumentRegistry } from './registries/plugin-document.registry';
import { PluginConfigurationRegistry } from './registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from './registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from './registries/plugin-search.registry';

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
    PluginLoaderService,
    PluginWorkflowRegistry,
    PluginPermissionRegistry,
    PluginNotificationRegistry,
    PluginDocumentRegistry,
    PluginConfigurationRegistry,
    PluginSchedulerRegistry,
    PluginSearchRegistry,
  ],
  exports: [PluginService],
})
export class PluginModule {}
