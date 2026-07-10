import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../../eventbus/services/eventbus.service';
import { PluginService } from '../../services/plugin.service';
import { PluginPackageService } from '../../package/services/plugin-package.service';
import { PluginPackageExtractorService } from '../archive/plugin-package-extractor.service';
import { PluginDiscoveryService } from '../discovery/plugin-discovery.service';
import { PluginInstallationRollbackService } from '../rollback/plugin-installation-rollback.service';
import { PluginDependencyResolverService } from '../dependency/plugin-dependency-resolver.service';
import { InstallPluginPackageDto } from '../dto/install-plugin-package.dto';
import { PluginMigrationRunnerService } from '../migration/plugin-migration-runner.service';
import { PluginPackageValidatorService } from '../validator/plugin-package-validator.service';
import { PluginInstallationManifestService } from '../manifest/plugin-installation-manifest.service';
import { PluginInstallationResult } from '../types/plugin-installer.types';

@Injectable()
export class PluginInstallerService {
  private readonly eventSource = 'core.plugin.installer';

  constructor(
    private readonly extractor: PluginPackageExtractorService,
    private readonly discovery: PluginDiscoveryService,
    private readonly rollbackService: PluginInstallationRollbackService,
    private readonly validator: PluginPackageValidatorService,
    private readonly dependencyResolver: PluginDependencyResolverService,
    private readonly migrationRunner: PluginMigrationRunnerService,
    private readonly manifestService: PluginInstallationManifestService,
    private readonly pluginPackageService: PluginPackageService,
    private readonly pluginService: PluginService,
    private readonly eventBus: EventBusService,
  ) {}

  async install(
    dto: InstallPluginPackageDto,
  ): Promise<PluginInstallationResult> {
    await this.eventBus.publish(
      'plugin.installation.started',
      this.eventSource,
      {
        packagePath: dto.packagePath,
        autoEnable: dto.autoEnable,
        overwrite: dto.overwrite,
        metadata: dto.metadata ?? {},
      },
    );

    let extractedPath: string | undefined;
    let migrationResult: { executed: string[]; skipped: string[] } | undefined;

    try {
      extractedPath = await this.extractor.extract(dto.packagePath);
      const pluginRoot = this.discovery.discover(extractedPath);

      const manifest = this.manifestService.discover(pluginRoot);

      const validationErrors = await this.validator.validate(pluginRoot, manifest);

      if (validationErrors.length) {
        return {
          success: false,
          stage: 'FAILED',
          manifest: this.manifestService.toInstalledManifest(manifest),
          messages: validationErrors,
          error: 'PLUGIN_VALIDATION_FAILED',
        };
      }

      const pluginPackage = this.pluginPackageService.register({
        packageName: manifest.name,
        version: manifest.version,
        manifest: this.manifestService.toPackageManifest(manifest),
        sourcePath: pluginRoot,
      });

      if (pluginPackage.status === 'FAILED') {
        return {
          success: false,
          stage: 'FAILED',
          manifest: this.manifestService.toInstalledManifest(manifest),
          messages: [
            ...pluginPackage.validationErrors,
            ...pluginPackage.validationWarnings,
          ],
          error: 'PLUGIN_PACKAGE_VALIDATION_FAILED',
        };
      }

      const installedPlugins = (await this.pluginService.installedPlugins()).map(
        (plugin) => ({
          name: plugin.name,
          version: plugin.version,
          status: plugin.status,
        }),
      );

      const dependencyResult =
        await this.dependencyResolver.validateDependencies(
          manifest.dependencies ?? [],
          installedPlugins,
        );

      if (!dependencyResult.valid) {
        return {
          success: false,
          stage: 'FAILED',
          manifest: this.manifestService.toInstalledManifest(manifest),
          messages: dependencyResult.errors,
          error: 'PLUGIN_DEPENDENCY_RESOLUTION_FAILED',
        };
      }

      migrationResult = await this.migrationRunner.run(pluginRoot, manifest.name);

      const installation = await this.pluginService.install({
        manifest: this.manifestService.toInstalledManifest(manifest),
      });

      if (dto.autoEnable !== false) {
        await this.pluginService.activate(installation.plugin.id);
      }

      await this.eventBus.publish(
        'plugin.installation.completed',
        this.eventSource,
        {
          packagePath: dto.packagePath,
          pluginRoot,
          pluginId: installation.plugin.id,
          packageId: pluginPackage.id,
          autoEnabled: dto.autoEnable !== false,
        },
      );

      return {
        success: true,
        stage: 'COMPLETE',
        manifest: this.manifestService.toInstalledManifest(manifest),
        installedPluginId: installation.plugin.id,
        messages: [
          'Plugin extracted',
          'Plugin root discovered',
          'Manifest discovered',
          'Plugin package registered',
          'Plugin validated',
          'Dependencies resolved',
          `Migrations executed: ${migrationResult.executed.length}`,
          `Migrations skipped: ${migrationResult.skipped.length}`,
          'Plugin installed',
          dto.autoEnable !== false ? 'Plugin activated' : 'Plugin left inactive',
        ],
      };
    } catch (error) {
      if (migrationResult?.executed.length) {
        await this.migrationRunner.rollback(migrationResult.executed);
      }

      if (extractedPath) {
        this.rollbackService.rollback(extractedPath);
      }

      const message = error instanceof Error ? error.message : 'Unknown plugin installation error';

      await this.eventBus.publish(
        'plugin.installation.failed',
        this.eventSource,
        {
          packagePath: dto.packagePath,
          extractedPath,
          error: message,
        },
      );

      return {
        success: false,
        stage: 'FAILED',
        messages: [message],
        error: 'PLUGIN_INSTALLATION_FAILED',
      };
    }
  }
}
