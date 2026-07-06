import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { PluginLoaderService } from '../loader/plugin-loader.service';

@Injectable()
export class PluginService implements OnModuleInit {
  private readonly eventSource = 'core.plugin';
  private pluginsLoaded = false;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly pluginLoader: PluginLoaderService,
  ) {}

  onModuleInit() {
    this.ensurePluginsLoaded();
  }

  private ensurePluginsLoaded(): void {
    if (!this.pluginsLoaded) {
      this.pluginLoader.loadPlugins();
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
    this.ensurePluginsLoaded();

    return this.pluginLoader.listPlugins().map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      provider: entry.manifest.provider ?? entry.manifest.author ?? 'unknown',
      enabled: entry.manifest.enabled !== false,
      status: entry.status,
      error: entry.error,
    }));
  }
}
