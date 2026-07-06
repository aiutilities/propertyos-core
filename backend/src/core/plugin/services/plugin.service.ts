import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { PluginLoaderService } from '../loader/plugin-loader.service';
import { PluginWorkflowRegistry } from '../registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from '../registries/plugin-permission.registry';
import { PluginNotificationRegistry } from '../registries/plugin-notification.registry';
import { PluginDocumentRegistry } from '../registries/plugin-document.registry';
import { PluginConfigurationRegistry } from '../registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from '../registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from '../registries/plugin-search.registry';

@Injectable()
export class PluginService implements OnModuleInit {
  private readonly eventSource = 'core.plugin';
  private pluginsLoaded = false;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly pluginLoader: PluginLoaderService,
    private readonly workflowRegistry: PluginWorkflowRegistry,
    private readonly permissionRegistry: PluginPermissionRegistry,
    private readonly notificationRegistry: PluginNotificationRegistry,
    private readonly documentRegistry: PluginDocumentRegistry,
    private readonly configurationRegistry: PluginConfigurationRegistry,
    private readonly schedulerRegistry: PluginSchedulerRegistry,
    private readonly searchRegistry: PluginSearchRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensurePluginsLoaded();
  }

  private async ensurePluginsLoaded(): Promise<void> {
    if (!this.pluginsLoaded) {
      await this.pluginLoader.loadPlugins();
      this.pluginsLoaded = true;
    }
  }

  async install(dto: CreatePluginDto) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_INSTALLED,
      this.eventSource,
      { manifest: dto.manifest },
    );

    return {
      success: true,
      plugin: dto.manifest,
      status: 'INSTALLED',
    };
  }

  async activate(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_ACTIVATED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'ACTIVE' };
  }

  async deactivate(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_DEACTIVATED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'INACTIVE' };
  }

  async uninstall(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_UNINSTALLED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'UNINSTALLED' };
  }

  async list() {
    await this.ensurePluginsLoaded();

    return this.pluginLoader.listPlugins().map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      provider: entry.manifest.provider ?? entry.manifest.author ?? 'unknown',
      enabled: entry.manifest.enabled !== false,
      status: entry.status,
      capabilities: {
        permissions: this.permissionRegistry.findByPlugin(entry.manifest.id).length,
        workflows: this.workflowRegistry.findByPlugin(entry.manifest.id).length,
        notifications: this.notificationRegistry.findByPlugin(entry.manifest.id).length,
        documents: this.documentRegistry.findByPlugin(entry.manifest.id).length,
        configuration: this.configurationRegistry.findByPlugin(entry.manifest.id).length,
        scheduler: this.schedulerRegistry.findByPlugin(entry.manifest.id).length,
        search: this.searchRegistry.findByPlugin(entry.manifest.id).length,
      },
      error: entry.error,
    }));
  }
}
