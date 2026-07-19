export class InstallPluginPublicationDto {
  autoEnable?: boolean = true;
  overwrite?: boolean = false;
  metadata?: Record<string, unknown>;
}
