import { BadRequestException, Injectable } from '@nestjs/common';
import { EventBusService } from '../../../eventbus/services/eventbus.service';
import { StorageService } from '../../../storage';
import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
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
import {
  PluginInstallationConflictError,
  PluginInstallationCoordinatorService,
} from '../coordination/plugin-installation-coordinator.service';

@Injectable()
export class PluginInstallerService {
  private readonly eventSource = 'core.plugin.installer';

  constructor(
    private readonly extractor: PluginPackageExtractorService,
    private readonly coordinator: PluginInstallationCoordinatorService,
    private readonly discovery: PluginDiscoveryService,
    private readonly rollbackService: PluginInstallationRollbackService,
    private readonly validator: PluginPackageValidatorService,
    private readonly dependencyResolver: PluginDependencyResolverService,
    private readonly migrationRunner: PluginMigrationRunnerService,
    private readonly manifestService: PluginInstallationManifestService,
    private readonly pluginPackageService: PluginPackageService,
    private readonly pluginService: PluginService,
    private readonly eventBus: EventBusService,
    private readonly storageService: StorageService,
  ) {}

  async install(
    dto: InstallPluginPackageDto,
  ): Promise<PluginInstallationResult> {
    const materializedPackage =
      await this.resolvePackage(dto);

    const requestKey =
      await this.hashPackage(
        materializedPackage.path,
      );

    try {
      const coordinated =
        await this.coordinator.coordinate(
          requestKey,
          () =>
            this.performInstall(
              dto,
              materializedPackage,
              requestKey,
            ),
          (result) =>
            result.success,
        );

      return {
        ...coordinated.value,
        requestKey,
        replayed:
          coordinated.replayed,
        messages:
          coordinated.replayed
            ? [
                ...coordinated.value.messages,
                'Installation result replayed from completed attempt',
              ]
            : coordinated.value.messages,
      };
    } catch (error) {
      if (
        error instanceof
          PluginInstallationConflictError
      ) {
        return {
          success: false,
          stage: 'FAILED',
          requestKey,
          replayed: false,
          messages: [
            error.message,
          ],
          error:
            'PLUGIN_INSTALLATION_IN_PROGRESS',
        };
      }

      throw error;
    } finally {
      if (materializedPackage.temporary) {
        await rm(
          materializedPackage.path,
          {
            force: true,
          },
        );
      }
    }
  }

  private async performInstall(
    dto: InstallPluginPackageDto,
    materializedPackage: {
      path: string;
      temporary: boolean;
    },
    requestKey: string,
  ): Promise<PluginInstallationResult> {
    await this.eventBus.publish(
      'plugin.installation.started',
      this.eventSource,
      {
        packagePath: materializedPackage.path,
        storageObjectId: dto.storageObjectId,
        requestKey,
        autoEnable: dto.autoEnable,
        overwrite: dto.overwrite,
        metadata: dto.metadata ?? {},
      },
    );

    let extractedPath: string | undefined;
    let pluginRoot: string | undefined;
    let migrationPluginName: string | undefined;
    let migrationResult: { executed: string[]; skipped: string[] } | undefined;
    let installationCompleted = false;

    try {
      extractedPath = await this.extractor.extract(materializedPackage.path);
      pluginRoot =
        this.discovery.discover(
          extractedPath,
        );

      const manifest =
        this.manifestService.discover(
          pluginRoot,
        );

      migrationPluginName =
        manifest.name;

      const validationErrors =
        await this.validator.validate(
          pluginRoot,
          manifest,
        );

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

      migrationResult =
        await this.migrationRunner.run(
          pluginRoot,
          manifest.name,
          manifest.version,
        );

      const installation = await this.pluginService.install({
        manifest: this.manifestService.toInstalledManifest(manifest),
      });

      if (dto.autoEnable !== false) {
        await this.pluginService.activate(installation.plugin.id);
      }

      installationCompleted = true;

      await this.eventBus.publish(
        'plugin.installation.completed',
        this.eventSource,
        {
          packagePath: materializedPackage.path,
          storageObjectId: dto.storageObjectId,
          requestKey,
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
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown plugin installation error';

      let migrationRollbackError:
        string | undefined;

      if (migrationResult?.executed.length) {
        try {
          await this.migrationRunner.rollback(
            migrationResult.executed,
            pluginRoot,
            migrationPluginName,
          );
        } catch (rollbackError) {
          migrationRollbackError =
            rollbackError instanceof Error
              ? rollbackError.message
              : 'Unknown migration rollback error';
        }
      }

      await this.eventBus.publish(
        'plugin.installation.failed',
        this.eventSource,
        {
          packagePath: materializedPackage.path,
          storageObjectId: dto.storageObjectId,
          requestKey,
          extractedPath,
          error: message,
          migrationRollbackError,
          requiresManualRecovery:
            migrationRollbackError !== undefined,
        },
      );

      return {
        success: false,
        stage: 'FAILED',
        messages:
          migrationRollbackError
            ? [
                message,
                migrationRollbackError,
              ]
            : [
                message,
              ],
        error:
          migrationRollbackError
            ? 'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE'
            : 'PLUGIN_INSTALLATION_FAILED',
      };
    } finally {
      if (
        extractedPath &&
        installationCompleted === false
      ) {
        this.rollbackService.rollback(
          extractedPath,
        );
      }
    }
  }

  private async hashPackage(
    packagePath: string,
  ): Promise<string> {
    const content =
      await readFile(packagePath);

    return createHash('sha256')
      .update(content)
      .digest('hex');
  }

  private async resolvePackage(
    dto: InstallPluginPackageDto,
  ): Promise<{ path: string; temporary: boolean }> {
    if (dto.packagePath) {
      return {
        path: dto.packagePath,
        temporary: false,
      };
    }

    if (!dto.storageObjectId) {
      throw new BadRequestException(
        'Either packagePath or storageObjectId is required',
      );
    }

    const content = await this.storageService.getContent(
      dto.storageObjectId,
    );

    const uploadDirectory = join(
      process.cwd(),
      'plugins',
      '.uploads',
    );

    await mkdir(uploadDirectory, { recursive: true });

    const packagePath = join(
      uploadDirectory,
      `${randomUUID()}.zip`,
    );

    await writeFile(packagePath, content);

    return {
      path: packagePath,
      temporary: true,
    };
  }
}
