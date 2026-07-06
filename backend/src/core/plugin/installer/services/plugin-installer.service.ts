import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../../eventbus/services/eventbus.service';
import { PluginPackageExtractorService } from '../archive/plugin-package-extractor.service';
import { PluginDependencyResolverService } from '../dependency/plugin-dependency-resolver.service';
import { InstallPluginPackageDto } from '../dto/install-plugin-package.dto';
import { PluginMigrationRunnerService } from '../migration/plugin-migration-runner.service';
import { PluginPackageValidatorService } from '../validator/plugin-package-validator.service';
import { PluginInstallationResult } from '../types/plugin-installer.types';

@Injectable()
export class PluginInstallerService {
  private readonly eventSource = 'core.plugin.installer';

  constructor(
    private readonly extractor: PluginPackageExtractorService,
    private readonly validator: PluginPackageValidatorService,
    private readonly dependencyResolver: PluginDependencyResolverService,
    private readonly migrationRunner: PluginMigrationRunnerService,
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

    const extractedPath = await this.extractor.extract(dto.packagePath);

    const validationErrors = await this.validator.validate(extractedPath);

    if (validationErrors.length) {
      return {
        success: false,
        stage: 'FAILED',
        messages: validationErrors,
        error: 'PLUGIN_VALIDATION_FAILED',
      };
    }

    await this.dependencyResolver.resolve();
    await this.migrationRunner.run();

    await this.eventBus.publish(
      'plugin.installation.completed',
      this.eventSource,
      {
        packagePath: dto.packagePath,
      },
    );

    return {
      success: true,
      stage: 'COMPLETE',
      messages: [
        'Plugin extracted',
        'Plugin validated',
        'Dependencies resolved',
        'Migrations executed',
        'Plugin ready for registration',
      ],
    };
  }
}
