export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  permissions?: string[];
  dependencies?: string[];
  minimumPlatformVersion?: string;
  extensionPoints?: string[];
}
