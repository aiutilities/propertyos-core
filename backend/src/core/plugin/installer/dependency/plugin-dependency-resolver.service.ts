import { Injectable } from '@nestjs/common';
import semver from 'semver';

export interface InstalledPluginDependency {
  name: string;
  version: string;
  status?: string;
}

export interface PluginDependencyResolutionResult {
  valid: boolean;
  errors: string[];
  missing: string[];
  installed: string[];
}

@Injectable()
export class PluginDependencyResolverService {
  async resolve(): Promise<string[]> {
    return [];
  }

  async resolveManifestDependencies(
    dependencies: string[] = [],
    installedPlugins: string[] = [],
  ): Promise<string[]> {
    return dependencies.filter(
      (dependency) => !installedPlugins.includes(dependency),
    );
  }

  async validateDependencies(
    dependencies: string[] = [],
    installedPlugins: InstalledPluginDependency[] = [],
  ): Promise<PluginDependencyResolutionResult> {
    const errors: string[] = [];
    const missing: string[] = [];
    const installed: string[] = [];

    for (const dependency of dependencies) {
      const parsed = this.parseDependency(dependency);
      const match = installedPlugins.find(
        (plugin) => plugin.name === parsed.name,
      );

      if (!match) {
        missing.push(parsed.name);
        errors.push(`Missing plugin dependency: ${parsed.name}`);
        continue;
      }

      installed.push(parsed.name);

      if (
        parsed.versionRange &&
        semver.valid(match.version) &&
        !semver.satisfies(match.version, parsed.versionRange)
      ) {
        errors.push(
          `Plugin dependency ${parsed.name} requires ${parsed.versionRange}, installed version is ${match.version}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      missing,
      installed,
    };
  }

  private parseDependency(dependency: string): {
    name: string;
    versionRange?: string;
  } {
    const match = dependency.match(/^([^@]+)(?:@(.+))?$/);

    if (!match) {
      return { name: dependency };
    }

    return {
      name: match[1],
      versionRange: match[2],
    };
  }
}
