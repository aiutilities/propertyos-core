export type MarketplacePluginStatus =
  | 'AVAILABLE'
  | 'INSTALLED'
  | 'UPDATE_AVAILABLE'
  | 'DEPRECATED'
  | 'INCOMPATIBLE';

export interface MarketplacePluginVersion {
  publicationId: string;
  version: string;
  releasedAt: Date;
  minimumPlatformVersion: string;
  checksum: string;
  integrityChecksum: string;
  publisherKeyId: string;
  artifactStorageObjectId: string;
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

export interface MarketplaceRepository {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: number;
}

export interface MarketplaceSearchResult {
  total: number;
  items: MarketplacePlugin[];
}
