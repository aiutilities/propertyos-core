export type PluginStatus =
  | 'INSTALLED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNINSTALLED';

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  minPlatformVersion?: string;
}
