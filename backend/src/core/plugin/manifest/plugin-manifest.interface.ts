export interface PluginManifest {
  id: string;
  name: string;
  version: string;

  provider?: string;
  author?: string;
  description?: string;
  enabled?: boolean;
  bootstrap?: string;
  entrypoint?: string;
  moduleClass?: string;

  permissions?: unknown[];
  workflows?: unknown[];
  notifications?: unknown[];
  documents?: unknown[];
  search?: unknown[];
  configuration?: unknown[];
  scheduler?: unknown[];
  routes?: unknown[];

  dependencies?: string[];
  minimumPlatformVersion?: string;
  extensionPoints?: string[];
}
