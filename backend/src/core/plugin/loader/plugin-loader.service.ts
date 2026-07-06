import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { validatePluginManifest } from '../manifest/plugin-manifest.validator';
import { PluginRegistryEntry } from '../types/plugin-runtime.types';
import { PluginWorkflowRegistry } from '../registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from '../registries/plugin-permission.registry';
import { PluginNotificationRegistry } from '../registries/plugin-notification.registry';
import { PluginDocumentRegistry } from '../registries/plugin-document.registry';
import { PluginConfigurationRegistry } from '../registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from '../registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from '../registries/plugin-search.registry';

@Injectable()
export class PluginLoaderService {
  private readonly logger = new Logger(PluginLoaderService.name);
  private readonly plugins = new Map<string, PluginRegistryEntry>();

  constructor(
    private readonly workflowRegistry: PluginWorkflowRegistry,
    private readonly permissionRegistry: PluginPermissionRegistry,
    private readonly notificationRegistry: PluginNotificationRegistry,
    private readonly documentRegistry: PluginDocumentRegistry,
    private readonly configurationRegistry: PluginConfigurationRegistry,
    private readonly schedulerRegistry: PluginSchedulerRegistry,
    private readonly searchRegistry: PluginSearchRegistry,
  ) {}

  loadPlugins(): PluginRegistryEntry[] {
    const pluginsRoot = join(process.cwd(), 'plugins');

    if (!existsSync(pluginsRoot)) {
      this.logger.warn('No plugins directory found');
      return [];
    }

    const pluginFolders = readdirSync(pluginsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const folder of pluginFolders) {
      this.loadPlugin(join(pluginsRoot, folder));
    }

    return this.listPlugins();
  }

  listPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  private loadPlugin(pluginPath: string): void {
    try {
      const manifestPath = join(pluginPath, 'plugin.json');

      if (!existsSync(manifestPath)) {
        return;
      }

      const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const manifest = validatePluginManifest(rawManifest);

      if (manifest.enabled === false) {
        this.plugins.set(manifest.id, {
          manifest,
          status: 'DISABLED',
        });
        return;
      }

      this.permissionRegistry.register(manifest.id, manifest.permissions ?? []);
      this.workflowRegistry.register(manifest.id, manifest.workflows ?? []);
      this.notificationRegistry.register(manifest.id, manifest.notifications ?? []);
      this.documentRegistry.register(manifest.id, manifest.documents ?? []);
      this.configurationRegistry.register(manifest.id, manifest.configuration ?? []);
      this.schedulerRegistry.register(manifest.id, manifest.scheduler ?? []);
      this.searchRegistry.register(manifest.id, manifest.search ?? []);

      this.plugins.set(manifest.id, {
        manifest,
        status: 'ACTIVE',
      });

      this.logger.log(`Plugin active: ${manifest.name} (${manifest.id})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown plugin load error';

      this.plugins.set(pluginPath, {
        manifest: {
          id: pluginPath,
          name: pluginPath,
          version: 'unknown',
          provider: 'unknown',
          enabled: false,
        },
        status: 'FAILED',
        error: message,
      });

      this.logger.error(`Plugin failed: ${pluginPath} - ${message}`);
    }
  }
}
