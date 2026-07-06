import {
  PluginPackageManifest,
  PluginPackageValidationResult,
} from '../types/plugin-package.types';

export class PluginPackageValidator {
  validateManifest(
    manifest: PluginPackageManifest,
  ): PluginPackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of ['id', 'name', 'version'] as const) {
      if (!manifest[field]) {
        errors.push(`Missing required manifest field: ${field}`);
      }
    }

    if (!manifest.provider) {
      warnings.push('Manifest provider is missing');
    }

    if (!manifest.minimumPlatformVersion) {
      warnings.push('minimumPlatformVersion is missing');
    }

    if (!Array.isArray(manifest.dependencies)) {
      warnings.push('dependencies should be declared as an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
