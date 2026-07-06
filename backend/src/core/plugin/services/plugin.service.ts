import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpgradePluginDto } from '../dto/upgrade-plugin.dto';
import { RollbackPluginDto } from '../dto/rollback-plugin.dto';
import { PluginLoaderService } from '../loader/plugin-loader.service';
import { PluginWorkflowRegistry } from '../registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from '../registries/plugin-permission.registry';
import { PluginNotificationRegistry } from '../registries/plugin-notification.registry';
import { PluginDocumentRegistry } from '../registries/plugin-document.registry';
import { PluginConfigurationRegistry } from '../registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from '../registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from '../registries/plugin-search.registry';
import { PLUGIN_REPOSITORY } from '../plugin.constants';
import { PluginRepository } from '../repositories/plugin-repository.interface';
import { PluginManifest } from '../types/plugin.types';

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
    @Inject(PLUGIN_REPOSITORY)
    private readonly pluginRepository: PluginRepository,
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
    const manifest = dto.manifest;
    const existing = await this.pluginRepository.findByName(manifest.name);

    const plugin = existing
      ? await this.pluginRepository.update(existing.id, {
          version: manifest.version,
          manifest,
          status: 'INSTALLED',
          deactivatedAt: new Date(),
        })
      : await this.pluginRepository.create({
          name: manifest.name,
          displayName: manifest.displayName,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          manifest,
          status: 'INSTALLED',
        });

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_INSTALLED,
      this.eventSource,
      { manifest, pluginId: plugin.id },
    );

    return {
      success: true,
      plugin,
      status: 'INSTALLED',
    };
  }

  async activate(id: string) {
    const plugin = await this.requireInstalledPlugin(id);

    const updated = await this.pluginRepository.update(plugin.id, {
      status: 'ACTIVE',
      activatedAt: new Date(),
    });

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_ACTIVATED,
      this.eventSource,
      { id: plugin.id },
    );

    return { success: true, plugin: updated, status: 'ACTIVE' };
  }

  async deactivate(id: string) {
    const plugin = await this.requireInstalledPlugin(id);

    const updated = await this.pluginRepository.update(plugin.id, {
      status: 'INACTIVE',
      deactivatedAt: new Date(),
    });

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_DEACTIVATED,
      this.eventSource,
      { id: plugin.id },
    );

    return { success: true, plugin: updated, status: 'INACTIVE' };
  }

  async uninstall(id: string) {
    const plugin = await this.requireInstalledPlugin(id);

    const updated = await this.pluginRepository.update(plugin.id, {
      status: 'UNINSTALLED',
      deactivatedAt: new Date(),
    });

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_UNINSTALLED,
      this.eventSource,
      { id: plugin.id },
    );

    return { success: true, plugin: updated, status: 'UNINSTALLED' };
  }

  async remove(id: string) {
    const plugin = await this.requireInstalledPlugin(id);

    await this.pluginRepository.remove(plugin.id);

    return {
      success: true,
      id: plugin.id,
      status: 'REMOVED',
    };
  }

  async upgrade(id: string, dto: UpgradePluginDto) {
    const plugin = await this.requireInstalledPlugin(id);

    const nextManifest = dto.manifest ?? {
      ...plugin.manifest,
      version: dto.version,
    };

    const updated = await this.pluginRepository.update(plugin.id, {
      version: dto.version,
      manifest: nextManifest,
      status: 'INSTALLED',
      deactivatedAt: new Date(),
    });

    await this.eventBus.publish(
      'plugin.upgraded',
      this.eventSource,
      {
        id: plugin.id,
        fromVersion: plugin.version,
        toVersion: dto.version,
        notes: dto.notes,
      },
    );

    return {
      success: true,
      plugin: updated,
      status: 'UPGRADED',
    };
  }

  async rollback(id: string, dto: RollbackPluginDto) {
    const plugin = await this.requireInstalledPlugin(id);

    const nextManifest = {
      ...plugin.manifest,
      version: dto.targetVersion,
    };

    const updated = await this.pluginRepository.update(plugin.id, {
      version: dto.targetVersion,
      manifest: nextManifest,
      status: 'INSTALLED',
      deactivatedAt: new Date(),
    });

    await this.eventBus.publish(
      'plugin.rolled_back',
      this.eventSource,
      {
        id: plugin.id,
        fromVersion: plugin.version,
        toVersion: dto.targetVersion,
        notes: dto.notes,
      },
    );

    return {
      success: true,
      plugin: updated,
      status: 'ROLLED_BACK',
    };
  }

  async installedPlugins() {
    return this.pluginRepository.findAll();
  }

  async getInstalledPlugin(id: string) {
    return this.requireInstalledPlugin(id);
  }

  async getPluginDiagnostics(id: string) {
    const plugin = await this.getRuntimePlugin(id);

    return {
      id: plugin.id,
      name: plugin.name,
      status: plugin.status,
      validation: plugin.validation,
      loadReport: plugin.loadReport,
      error: plugin.error,
    };
  }

  async getPluginCapabilities(id: string) {
    const plugin = await this.getRuntimePlugin(id);

    return {
      id: plugin.id,
      name: plugin.name,
      capabilities: plugin.capabilities,
      permissions: this.permissionRegistry.findByPlugin(plugin.id),
      workflows: this.workflowRegistry.findByPlugin(plugin.id),
      notifications: this.notificationRegistry.findByPlugin(plugin.id),
      documents: this.documentRegistry.findByPlugin(plugin.id),
      configuration: this.configurationRegistry.findByPlugin(plugin.id),
      scheduler: this.schedulerRegistry.findByPlugin(plugin.id),
      search: this.searchRegistry.findByPlugin(plugin.id),
    };
  }

  async getPluginLifecycle(id: string) {
    const installed = await this.requireInstalledPlugin(id);

    return {
      id: installed.id,
      name: installed.name,
      status: installed.status,
      installedAt: installed.installedAt,
      activatedAt: installed.activatedAt,
      deactivatedAt: installed.deactivatedAt,
    };
  }

  async list() {
    await this.ensurePluginsLoaded();

    const runtimePlugins = this.pluginLoader.listPlugins().map((entry) => ({
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
      validation: entry.validation,
      loadReport: entry.loadReport,
    }));

    const installed = await this.pluginRepository.findAll();

    return runtimePlugins.map((runtimePlugin) => {
      const persisted = installed.find((plugin) =>
        this.isSamePlugin(plugin.manifest, runtimePlugin.name),
      );

      return {
        ...runtimePlugin,
        installed: Boolean(persisted),
        installedPluginId: persisted?.id,
        installedStatus: persisted?.status,
      };
    });
  }

  private async getRuntimePlugin(id: string) {
    await this.ensurePluginsLoaded();

    const plugin = (await this.list()).find(
      (item) => item.id === id || item.installedPluginId === id,
    );

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }

  private async requireInstalledPlugin(id: string) {
    const plugin = await this.pluginRepository.findById(id);

    if (!plugin) {
      throw new NotFoundException('Installed plugin not found');
    }

    return plugin;
  }

  private isSamePlugin(manifest: PluginManifest, runtimeName: string): boolean {
    return manifest.name === runtimeName;
  }
}
