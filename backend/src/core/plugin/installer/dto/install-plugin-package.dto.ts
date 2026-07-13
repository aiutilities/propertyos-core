export class InstallPluginPackageDto {
  packagePath?: string;
  storageObjectId?: string;
  autoEnable?: boolean = true;
  overwrite?: boolean = false;
  metadata?: Record<string, unknown>;
}
