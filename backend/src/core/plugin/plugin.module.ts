import { PluginInstallationRollbackService } from './installer/rollback/plugin-installation-rollback.service';
import { PluginDiscoveryService } from './installer/discovery/plugin-discovery.service';
import { PluginZipExtractorService } from './installer/extractor/plugin-zip-extractor.service';
import { PluginInstallationManifestService } from './installer/manifest/plugin-installation-manifest.service';
import { PluginMigrationRunnerService } from './installer/migration/plugin-migration-runner.service';
import { PluginDependencyResolverService } from './installer/dependency/plugin-dependency-resolver.service';
import { PluginPackageValidatorService } from './installer/validator/plugin-package-validator.service';
import { PluginSignatureVerifierService } from './installer/signature/plugin-signature-verifier.service';
import { PluginPackageExtractorService } from './installer/archive/plugin-package-extractor.service';
import { PluginInstallerService } from './installer/services/plugin-installer.service';
import { PluginInstallerController } from './installer/controllers/plugin-installer.controller';
import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { SearchModule } from '../search';
import { StorageModule } from '../storage';
import { IdentityModule } from '../identity/identity.module';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { PluginController } from './controllers/plugin.controller';
import { PluginPackageController } from './package/controllers/plugin-package.controller';
import { PluginMarketplaceController } from './marketplace/controllers/plugin-marketplace.controller';
import { PluginService } from './services/plugin.service';
import { PostgresPluginRepository } from './repositories/postgres-plugin.repository';
import { PLUGIN_REPOSITORY } from './plugin.constants';
import { PluginRegistry } from './sdk/plugin-registry';
import { PluginLoader } from './sdk/plugin-loader';
import { PluginManager } from './sdk/plugin-manager';
import { HookManager } from './sdk/hook-manager';
import { ExtensionRegistry } from './sdk/extension-registry';
import { PluginLifecycleService } from './lifecycle/plugin-lifecycle.service';
import { PluginLoaderService } from './loader/plugin-loader.service';
import { PluginRuntimeModuleLoaderService } from './runtime/plugin-runtime-module-loader.service';
import { PluginRuntimeActivationGuardService } from './runtime/plugin-runtime-activation-guard.service';
import { PluginWorkflowRegistry } from './registries/plugin-workflow.registry';
import { PluginPermissionRegistry } from './registries/plugin-permission.registry';
import { PluginNotificationRegistry } from './registries/plugin-notification.registry';
import { PluginDocumentRegistry } from './registries/plugin-document.registry';
import { PluginConfigurationRegistry } from './registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from './registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from './registries/plugin-search.registry';
import { PermissionBootstrapService } from './bootstrap/permission-bootstrap.service';
import { PluginPackageService } from './package/services/plugin-package.service';
import { PluginMarketplaceService } from './marketplace/services/plugin-marketplace.service';
import { PluginSearchProviderService } from './plugin-search-provider.service';

@Module({
  imports: [
    EventBusModule,
    IdentityModule,
    PostgresModule,
    SearchModule,
    StorageModule,
  ],
  controllers: [
    PluginController,
    PluginPackageController,
    PluginMarketplaceController,
    PluginInstallerController,
  ],
  providers: [
    PluginSearchProviderService,
    PluginInstallerService,
    PluginPackageExtractorService,
    PluginZipExtractorService,
    PluginDiscoveryService,
    PluginInstallationRollbackService,
    PluginPackageValidatorService,
    PluginSignatureVerifierService,
    PluginDependencyResolverService,
    PluginMigrationRunnerService,
    PluginInstallationManifestService,
    PluginService,
    {
      provide: PLUGIN_REPOSITORY,
      useClass: PostgresPluginRepository,
    },
    PluginRegistry,
    PluginLoader,
    PluginManager,
    HookManager,
    ExtensionRegistry,
    PluginLifecycleService,
    PluginLoaderService,
    PluginRuntimeModuleLoaderService,
    PluginRuntimeActivationGuardService,
    PluginWorkflowRegistry,
    PluginPermissionRegistry,
    PluginNotificationRegistry,
    PluginDocumentRegistry,
    PluginConfigurationRegistry,
    PluginSchedulerRegistry,
    PluginSearchRegistry,
    PermissionBootstrapService,
    PluginPackageService,
    PluginMarketplaceService,
  ],
  exports: [
    PluginService,
    PluginLoaderService,
    PluginRuntimeModuleLoaderService,
    PluginRuntimeActivationGuardService,
    PluginWorkflowRegistry,
    PluginPermissionRegistry,
    PluginNotificationRegistry,
    PluginDocumentRegistry,
    PluginConfigurationRegistry,
    PluginSchedulerRegistry,
    PluginSearchRegistry,
    PermissionBootstrapService,
    PluginPackageService,
    PluginMarketplaceService,
  ],
})
export class PluginModule {}
