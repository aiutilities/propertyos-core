export type PluginPackageStatus =
  | 'UPLOADED'
  | 'VALIDATED'
  | 'INSTALLED'
  | 'FAILED';

export interface PluginPackageManifest {
  id: string;
  name: string;
  version: string;
  provider?: string;
  description?: string;
  minimumPlatformVersion?: string;
  dependencies?: string[];
}

export interface PluginPackage {
  id: string;
  packageName: string;
  version: string;
  manifest: PluginPackageManifest;
  status: PluginPackageStatus;
  sourcePath?: string;
  validationErrors: string[];
  createdAt: Date;
}
