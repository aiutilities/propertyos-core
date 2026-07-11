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

export interface PluginLifecycle {
  id: string;
  name: string;
  status: PluginStatus;
  installedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
}

export interface PluginDiagnostics {
  id: string;
  name: string;
  status: string;
  validation?: unknown;
  loadReport?: unknown[];
  error?: string;
}

export interface PluginCapabilities {
  id: string;
  name: string;
  capabilities?: Record<string, number>;
  permissions: unknown[];
  workflows: unknown[];
  notifications: unknown[];
  documents: unknown[];
  configuration: unknown[];
  scheduler: unknown[];
  search: unknown[];
}

