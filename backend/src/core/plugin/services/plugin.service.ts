import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpgradePluginDto } from '../dto/upgrade-plugin.dto';
import { RollbackPluginDto } from '../dto/rollback-plugin.dto';
import { PluginLoaderService } from '../loader/plugin-loader.service';
import { PluginLifecycleService } from '../lifecycle/plugin-lifecycle.service';
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
    private readonly lifecycleService: PluginLifecycleService,
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
    const updates = await this.lifecycleService.activate(plugin);
    const updated = await this.pluginRepository.update(plugin.id, updates);

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_ACTIVATED,
      this.eventSource,
      { id: plugin.id },
    );

    return this.lifecycleService.buildResult(
      updated,
      'ACTIVE',
      plugin.status,
    );
  }

  async deactivate(id: string) {
    const plugin = await this.requireInstalledPlugin(id);
    const updates = await this.lifecycleService.deactivate(plugin);
    const updated = await this.pluginRepository.update(plugin.id, updates);

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_DEACTIVATED,
      this.eventSource,
      { id: plugin.id },
    );

    return this.lifecycleService.buildResult(
      updated,
      'INACTIVE',
      plugin.status,
    );
  }

  async uninstall(id: string) {
    const plugin = await this.requireInstalledPlugin(id);

    const dependents =
      await this.pluginRepository.findDependents(plugin.name);

    if (dependents.length > 0) {
      return {
        success: false,
        status: 'DEPENDENCY_BLOCKED',
        plugin: plugin.name,
        dependents: dependents.map((item) => ({
          id: item.id,
          name: item.name,
          version: item.version,
        })),
        error:
          'PLUGIN_UNINSTALL_BLOCKED_BY_DEPENDENCIES',
      };
    }

    const updates = await this.lifecycleService.uninstall(plugin);
    const updated = await this.pluginRepository.update(plugin.id, updates);

    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_UNINSTALLED,
      this.eventSource,
      { id: plugin.id },
    );

    return this.lifecycleService.buildResult(
      updated,
      'UNINSTALLED',
      plugin.status,
    );
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
    const updates = await this.lifecycleService.upgrade(plugin, dto);
    const updated = await this.pluginRepository.update(plugin.id, updates);

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

    return this.lifecycleService.buildResult(
      updated,
      'UPGRADED',
      plugin.status,
      plugin.version,
      dto.version,
    );
  }

  async rollback(id: string, dto: RollbackPluginDto) {
    const plugin = await this.requireInstalledPlugin(id);
    const updates = await this.lifecycleService.rollback(plugin, dto);
    const updated = await this.pluginRepository.update(plugin.id, updates);

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

    return this.lifecycleService.buildResult(
      updated,
      'ROLLED_BACK',
      plugin.status,
      plugin.version,
      dto.targetVersion,
    );
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
