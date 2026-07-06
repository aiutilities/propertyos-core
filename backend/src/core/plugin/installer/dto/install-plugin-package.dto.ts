export class InstallPluginPackageDto {
  packagePath!: string;
  autoEnable?: boolean = true;
  overwrite?: boolean = false;
  metadata?: Record<string, unknown>;
}
