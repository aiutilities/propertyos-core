export type PluginPackageStatus =
  | 'UPLOADED'
  | 'VALIDATED'
  | 'INSTALLED'
  | 'FAILED'
  | 'EXPORTED'
  | 'IMPORTED';

export type PluginPackageFileType =
  | 'manifest'
  | 'permissions'
  | 'workflows'
  | 'notifications'
  | 'documents'
  | 'configuration'
  | 'scheduler'
  | 'search'
  | 'routes'
  | 'asset'
  | 'other';

export interface PluginPackageManifest {
  id: string;
  name: string;
  version: string;
  provider?: string;
  description?: string;
  minimumPlatformVersion?: string;
  dependencies?: string[];
}

export interface PluginPackageFile {
  path: string;
  type: PluginPackageFileType;
  checksum?: string;
  sizeBytes?: number;
}

export interface PluginPackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PluginPackage {
  id: string;
  packageName: string;
  version: string;
  manifest: PluginPackageManifest;
  status: PluginPackageStatus;
  sourcePath?: string;
  files: PluginPackageFile[];
  validationErrors: string[];
  validationWarnings: string[];
  createdAt: Date;
}
