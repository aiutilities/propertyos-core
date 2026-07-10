import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { validatePluginManifest } from '../manifest/plugin-manifest.validator';
import { PluginManifest } from '../manifest/plugin-manifest.interface';
import { PluginRegistryEntry } from '../types/plugin-runtime.types';
import { PluginWorkflowRegistry } from '../registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from '../registries/plugin-permission.registry';
import { PluginNotificationRegistry } from '../registries/plugin-notification.registry';
import { PluginDocumentRegistry } from '../registries/plugin-document.registry';
import { PluginConfigurationRegistry } from '../registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from '../registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from '../registries/plugin-search.registry';

type CapabilityKey =
  | 'permissions'
  | 'workflows'
  | 'notifications'
  | 'documents'
  | 'search'
  | 'configuration'
  | 'scheduler'
  | 'routes';

const PLATFORM_VERSION = '0.1.0';

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

  async loadPlugins(): Promise<PluginRegistryEntry[]> {
    const pluginsRoot = join(process.cwd(), 'plugins');

    if (!existsSync(pluginsRoot)) {
      this.logger.warn('No plugins directory found');
      return [];
    }

    const pluginFolders = readdirSync(pluginsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const folder of pluginFolders) {
      await this.loadPlugin(join(pluginsRoot, folder));
    }

    return this.listPlugins();
  }

  listPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const manifestPath = join(pluginPath, 'plugin.json');

      if (!existsSync(manifestPath)) {
        return;
      }

      const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const manifest = validatePluginManifest(rawManifest);

      const platformValidation = this.validatePlatformVersion(manifest);
      const dependencyValidation = this.validateDependencies(manifest);
      const validationErrors = [
        ...platformValidation.errors,
        ...dependencyValidation.errors,
      ];

      const validation = {
        compatible: platformValidation.compatible,
        dependenciesSatisfied: dependencyValidation.dependenciesSatisfied,
        errors: validationErrors,
      };

      if (manifest.enabled === false) {
        this.plugins.set(manifest.id, {
          manifest,
          status: 'DISABLED',
          validation,
          loadReport: ['Manifest validated', 'Plugin disabled'],
        });
        return;
      }

      if (!validation.compatible || !validation.dependenciesSatisfied) {
        this.plugins.set(manifest.id, {
          manifest,
          status: 'FAILED',
          error: validation.errors.join(', '),
          validation,
          loadReport: this.buildLoadReport(manifest, validation, {}),
        });

        this.logger.error(
          `Plugin failed validation: ${manifest.name} (${manifest.id}) - ${validation.errors.join(', ')}`,
        );
        return;
      }

      const permissions = await this.loadCapability(pluginPath, manifest, 'permissions');
      const workflows = await this.loadCapability(pluginPath, manifest, 'workflows');
      const notifications = await this.loadCapability(pluginPath, manifest, 'notifications');
      const documents = await this.loadCapability(pluginPath, manifest, 'documents');
      const configuration = await this.loadCapability(pluginPath, manifest, 'configuration');
      const scheduler = await this.loadCapability(pluginPath, manifest, 'scheduler');
      const search = await this.loadCapability(pluginPath, manifest, 'search');

      this.permissionRegistry.register(manifest.id, permissions);
      this.workflowRegistry.register(manifest.id, workflows);
      this.notificationRegistry.register(manifest.id, notifications);
      this.documentRegistry.register(manifest.id, documents);
      this.configurationRegistry.register(manifest.id, configuration);
      this.schedulerRegistry.register(manifest.id, scheduler);
      this.searchRegistry.register(manifest.id, search);

      this.plugins.set(manifest.id, {
        manifest,
        status: 'ACTIVE',
        validation,
        loadReport: this.buildLoadReport(manifest, validation, {
          permissions,
          workflows,
          notifications,
          documents,
          configuration,
          scheduler,
          search,
        }),
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
        validation: {
          compatible: false,
          dependenciesSatisfied: false,
          errors: [message],
        },
        loadReport: ['Plugin load failed', message],
      });

      this.logger.error(`Plugin failed: ${pluginPath} - ${message}`);
    }
  }

  private validatePlatformVersion(manifest: PluginManifest): {
    compatible: boolean;
    errors: string[];
  } {
    const requiredVersion = manifest.minimumPlatformVersion;

    if (!requiredVersion || this.compareVersions(PLATFORM_VERSION, requiredVersion) >= 0) {
      return {
        compatible: true,
        errors: [],
      };
    }

    return {
      compatible: false,
      errors: [
        `Plugin requires platform ${requiredVersion}, current platform is ${PLATFORM_VERSION}`,
      ],
    };
  }

  private validateDependencies(manifest: PluginManifest): {
    dependenciesSatisfied: boolean;
    errors: string[];
  } {
    const dependencies = manifest.dependencies ?? [];
    const errors: string[] = [];

    for (const dependency of dependencies) {
      if (!this.plugins.has(dependency)) {
        errors.push(`Missing plugin dependency: ${dependency}`);
      }
    }

    return {
      dependenciesSatisfied: errors.length === 0,
      errors,
    };
  }

  private buildLoadReport(
    manifest: PluginManifest,
    validation: {
      compatible: boolean;
      dependenciesSatisfied: boolean;
      errors: string[];
    },
    capabilities: Partial<Record<CapabilityKey, unknown[]>>,
  ): string[] {
    const report = ['Manifest validated'];

    report.push(
      validation.compatible ? 'Platform compatible' : 'Platform incompatible',
    );

    report.push(
      validation.dependenciesSatisfied
        ? 'Dependencies satisfied'
        : 'Dependencies missing',
    );

    if (validation.errors.length) {
      report.push(...validation.errors);
      return report;
    }

    report.push(`Permissions loaded: ${capabilities.permissions?.length ?? 0}`);
    report.push(`Workflows loaded: ${capabilities.workflows?.length ?? 0}`);
    report.push(`Notifications loaded: ${capabilities.notifications?.length ?? 0}`);
    report.push(`Documents loaded: ${capabilities.documents?.length ?? 0}`);
    report.push(`Configuration loaded: ${capabilities.configuration?.length ?? 0}`);
    report.push(`Scheduler loaded: ${capabilities.scheduler?.length ?? 0}`);
    report.push(`Search loaded: ${capabilities.search?.length ?? 0}`);
    report.push(`Plugin active: ${manifest.id}`);

    return report;
  }

  private compareVersions(current: string, required: string): number {
    const currentParts = current.split('.').map((part) => Number(part));
    const requiredParts = required.split('.').map((part) => Number(part));
    const maxLength = Math.max(currentParts.length, requiredParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const currentValue = currentParts[index] ?? 0;
      const requiredValue = requiredParts[index] ?? 0;

      if (currentValue > requiredValue) {
        return 1;
      }

      if (currentValue < requiredValue) {
        return -1;
      }
    }

    return 0;
  }

  private async loadCapability(
    pluginPath: string,
    manifest: PluginManifest,
    key: CapabilityKey,
  ): Promise<unknown[]> {
    const entries = manifest[key];

    if (!Array.isArray(entries)) {
      return [];
    }

    const loaded: unknown[] = [];

    for (const entry of entries) {
      if (typeof entry !== 'string') {
        loaded.push(entry);
        continue;
      }

      const modulePath = resolve(pluginPath, entry);
      const candidates = [
        `${modulePath}.ts`,
        `${modulePath}.js`,
        modulePath,
      ];

      const existingPath = candidates.find((candidate) => existsSync(candidate));

      if (!existingPath) {
        throw new Error(`Capability file not found for ${key}: ${entry}`);
      }

      // ts-node supports requiring .ts files in this runtime.
      // Later, production plugin packages can point to compiled .js files.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const imported = require(existingPath);

      for (const value of Object.values(imported)) {
        if (Array.isArray(value)) {
          loaded.push(...value);
        }
      }
    }

    return loaded;
  }
}
