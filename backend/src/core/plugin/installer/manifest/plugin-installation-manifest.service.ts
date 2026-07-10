import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { validatePluginManifest } from '../../manifest/plugin-manifest.validator';
import { PluginManifest as RuntimePluginManifest } from '../../manifest/plugin-manifest.interface';
import { PluginManifest as InstalledPluginManifest } from '../../types/plugin.types';
import { PluginPackageManifest } from '../../package/types/plugin-package.types';

@Injectable()
export class PluginInstallationManifestService {
  discover(pluginPath: string): RuntimePluginManifest {
    const manifestPath = join(pluginPath, 'plugin.json');

    if (!existsSync(manifestPath)) {
      throw new Error(`plugin.json not found at ${manifestPath}`);
    }

    const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    return validatePluginManifest(rawManifest);
  }

  toPackageManifest(manifest: RuntimePluginManifest): PluginPackageManifest {
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      provider: manifest.provider,
      description: manifest.description,
      minimumPlatformVersion: manifest.minimumPlatformVersion,
      dependencies: manifest.dependencies ?? [],
    };
  }

  toInstalledManifest(manifest: RuntimePluginManifest): InstalledPluginManifest {
    return {
      name: manifest.name,
      displayName: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author ?? manifest.provider,
      minPlatformVersion: manifest.minimumPlatformVersion,
    };
  }
}
