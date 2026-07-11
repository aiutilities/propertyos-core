export type PluginStatus =
  | "INSTALLED"
  | "ACTIVE"
  | "INACTIVE"
  | "UNINSTALLED";

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  minPlatformVersion?: string;
}

export interface Plugin {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
}
