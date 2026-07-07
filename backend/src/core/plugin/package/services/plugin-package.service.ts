import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterPluginPackageDto } from '../dto/register-plugin-package.dto';
import {
  PluginPackage,
  PluginPackageManifest,
} from '../types/plugin-package.types';
import { PluginPackageValidator } from '../validator/plugin-package.validator';
import { PluginPackageArchiveService } from '../archive/plugin-package-archive.service';

@Injectable()
export class PluginPackageService {
  private readonly packages = new Map<string, PluginPackage>();
  private readonly validator = new PluginPackageValidator();
  private readonly archive = new PluginPackageArchiveService();

  register(dto: RegisterPluginPackageDto): PluginPackage {
    const validation = this.validator.validateManifest(dto.manifest);
    const files = dto.sourcePath ? this.archive.listFiles(dto.sourcePath) : [];

    const checksumErrors = dto.sourcePath
      ? this.archive.validateChecksums(dto.sourcePath, files)
      : [];

    const validationErrors = [
      ...validation.errors,
      ...checksumErrors,
    ];

    const pluginPackage: PluginPackage = {
      id: randomUUID(),
      packageName: dto.packageName,
      version: dto.version,
      manifest: dto.manifest,
      sourcePath: dto.sourcePath,
      status: validationErrors.length === 0 ? 'VALIDATED' : 'FAILED',
      files,
      validationErrors,
      validationWarnings: validation.warnings,
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

    const validation = this.validator.validateManifest(pluginPackage.manifest);

    const checksumErrors = pluginPackage.sourcePath
      ? this.archive.validateChecksums(pluginPackage.sourcePath, pluginPackage.files)
      : [];

    const validationErrors = [
      ...validation.errors,
      ...checksumErrors,
    ];

    const updated: PluginPackage = {
      ...pluginPackage,
      validationErrors,
      validationWarnings: validation.warnings,
      status: validationErrors.length === 0 ? 'VALIDATED' : 'FAILED',
    };

    this.packages.set(id, updated);

    return updated;
  }
}
