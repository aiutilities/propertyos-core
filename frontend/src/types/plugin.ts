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

export type MarketplacePluginStatus =
  | "AVAILABLE"
  | "INSTALLED"
  | "UPDATE_AVAILABLE"
  | "DEPRECATED"
  | "INCOMPATIBLE";

export interface MarketplacePluginVersion {
  version: string;
  releasedAt: string;
  minimumPlatformVersion: string;
  downloadUrl?: string;
  checksum?: string;
  changelog?: string;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  provider: string;
  description?: string;
  category?: string;
  tags: string[];
  latestVersion: string;
  installedVersion?: string;
  status: MarketplacePluginStatus;
  rating?: number;
  downloads?: number;
  verified: boolean;
  versions: MarketplacePluginVersion[];
}

export interface MarketplaceSearchResult {
  total: number;
  items: MarketplacePlugin[];
}

export interface MarketplaceListResponse {
  success: boolean;
  data: MarketplacePlugin[];
}

export interface MarketplaceSearchResponse {
  success: boolean;
  data: MarketplaceSearchResult;
}

