import {
  PlatformRuntimeService,
} from '../../../platform/runtime/platform-runtime.service';
import {
  Injectable,
} from '@nestjs/common';
import semver from 'semver';

import {
  PluginDependencyResolverService,
} from '../../../plugin/installer/dependency/plugin-dependency-resolver.service';
import {
  PluginService,
} from '../../../plugin/services/plugin.service';
import {
  MarketplaceCatalogService,
} from '../../services/marketplace-catalog.service';
import {
  MarketplaceVersionService,
} from '../../version/services/marketplace-version.service';
import {
  MarketplaceResolutionDependency,
  MarketplaceResolutionResult,
} from '../entities/marketplace-resolution-result.entity';

@Injectable()
export class MarketplaceResolutionPlannerService {
  constructor(
    private readonly catalogue:
      MarketplaceCatalogService,
    private readonly versions:
      MarketplaceVersionService,
    private readonly plugins:
      PluginService,
    private readonly dependencyResolver:
      PluginDependencyResolverService,
    private readonly runtime?:
      PlatformRuntimeService,
  ) {}

  async plan(
    slug: string,
    version: string,
  ): Promise<MarketplaceResolutionResult> {
    const marketplacePlugin =
      await this.catalogue.details(slug);

    const approvedVersion =
      await this.versions.details(
        slug,
        version,
      );

    const installedPlugins =
      await this.plugins.installedPlugins();

    const installedPlugin =
      marketplacePlugin.pluginId
        ? installedPlugins.find(
            (plugin) =>
              plugin.id ===
              marketplacePlugin.pluginId,
          ) ?? null
        : null;

    const dependencyResult =
      await this.dependencyResolver
        .validateDependencies(
          approvedVersion.dependencies,
          installedPlugins.map(
            (plugin) => ({
              name:
                plugin.name,
              version:
                plugin.version,
              status:
                plugin.status,
            }),
          ),
        );

    const platformVersion =
      this.runtime?.platformVersion() ??
      PlatformRuntimeService
        .resolvePlatformVersion();

    const platformCompatible =
      this.isPlatformCompatible(
        platformVersion,
        approvedVersion
          .minimumPlatformVersion,
      );

    const dependencyDetails =
      this.describeDependencies(
        approvedVersion.dependencies,
        installedPlugins,
      );

    const errors = [
      ...dependencyResult.errors,
      ...(
        platformCompatible
          ? []
          : [
              `Plugin requires PropertyOS ${
                approvedVersion
                  .minimumPlatformVersion
              }, current platform is ${
                platformVersion
              }`,
            ]
      ),
    ];

    const action =
      !installedPlugin
        ? 'INSTALL' as const
        : semver.valid(
              installedPlugin.version,
            ) &&
            semver.valid(
              approvedVersion.version,
            ) &&
            semver.lt(
              approvedVersion.version,
              installedPlugin.version,
            )
          ? 'ROLLBACK' as const
          : 'UPGRADE' as const;

    return {
      slug,
      version:
        approvedVersion.version,
      publicationId:
        approvedVersion.publicationId,
      action,
      executable:
        errors.length === 0,
      platformCompatible,
      currentPlatformVersion:
        platformVersion,
      minimumPlatformVersion:
        approvedVersion
          .minimumPlatformVersion,
      installedPluginId:
        installedPlugin?.id ?? null,
      installedVersion:
        installedPlugin?.version ?? null,
      dependencies:
        dependencyDetails,
      missingDependencies:
        dependencyResult.missing,
      errors,
      warnings:
        approvedVersion.dependencies.length === 0
          ? [
              'No dependencies declared',
            ]
          : [],
      executionOrder: [
        ...dependencyResult.missing,
        slug,
      ],
    };
  }

  private isPlatformCompatible(
    currentVersion: string,
    minimumVersion: string | null,
  ): boolean {
    if (!minimumVersion) {
      return true;
    }

    if (
      !semver.valid(currentVersion) ||
      !semver.valid(minimumVersion)
    ) {
      return false;
    }

    return semver.gte(
      currentVersion,
      minimumVersion,
    );
  }

  private describeDependencies(
    declarations: string[],
    installedPlugins: Array<{
      name: string;
      version: string;
    }>,
  ): MarketplaceResolutionDependency[] {
    return declarations.map(
      (declaration) => {
        const parsed =
          this.parseDependency(
            declaration,
          );

        const installed =
          installedPlugins.find(
            (plugin) =>
              plugin.name === parsed.name,
          );

        const satisfied =
          Boolean(installed) &&
          (
            !parsed.range ||
            (
              semver.valid(
                installed!.version,
              ) !== null &&
              semver.satisfies(
                installed!.version,
                parsed.range,
              )
            )
          );

        return {
          declaration,
          name:
            parsed.name,
          installedVersion:
            installed?.version ?? null,
          satisfied,
        };
      },
    );
  }

  private parseDependency(
    declaration: string,
  ): {
    name: string;
    range?: string;
  } {
    const match =
      declaration.match(
        /^([^@]+)(?:@(.+))?$/,
      );

    if (!match) {
      return {
        name:
          declaration,
      };
    }

    return {
      name:
        match[1],
      range:
        match[2],
    };
  }
}
