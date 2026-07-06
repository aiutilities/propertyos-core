import { PluginPackageManifest } from '../types/plugin-package.types';

export class RegisterPluginPackageDto {
  packageName!: string;
  version!: string;
  manifest!: PluginPackageManifest;
  sourcePath?: string;
}
