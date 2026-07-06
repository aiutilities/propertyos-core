import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterPluginPackageDto } from '../dto/register-plugin-package.dto';
import {
  PluginPackage,
  PluginPackageManifest,
} from '../types/plugin-package.types';

@Injectable()
export class PluginPackageService {
  private readonly packages = new Map<string, PluginPackage>();

  register(dto: RegisterPluginPackageDto): PluginPackage {
    const validationErrors = this.validateManifest(dto.manifest);

    const pluginPackage: PluginPackage = {
      id: randomUUID(),
      packageName: dto.packageName,
      version: dto.version,
      manifest: dto.manifest,
      sourcePath: dto.sourcePath,
      status: validationErrors.length ? 'FAILED' : 'VALIDATED',
      validationErrors,
      createdAt: new Date(),
    };

    this.packages.set(pluginPackage.id, pluginPackage);

    return pluginPackage;
  }

  list(): PluginPackage[] {
    return [...this.packages.values()];
  }

  get(id: string): PluginPackage | undefined {
    return this.packages.get(id);
  }

  validate(id: string): PluginPackage | undefined {
    const pluginPackage = this.packages.get(id);

    if (!pluginPackage) {
      return undefined;
    }

    const validationErrors = this.validateManifest(pluginPackage.manifest);

    const updated: PluginPackage = {
      ...pluginPackage,
      validationErrors,
      status: validationErrors.length ? 'FAILED' : 'VALIDATED',
    };

    this.packages.set(id, updated);

    return updated;
  }

  private validateManifest(manifest: PluginPackageManifest): string[] {
    const errors: string[] = [];

    for (const field of ['id', 'name', 'version'] as const) {
      if (!manifest[field]) {
        errors.push(`Missing required manifest field: ${field}`);
      }
    }

    return errors;
  }
}
