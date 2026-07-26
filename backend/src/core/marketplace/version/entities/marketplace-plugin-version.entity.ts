export interface MarketplacePluginVersion {
  publicationId: string;
  pluginId: string;
  pluginName: string;
  publisherId: string;
  publisherKeyId: string;
  version: string;
  releasedAt: Date;
  reviewedAt: Date | null;
  artifactStorageObjectId: string;
  artifactSha256: string;
  integritySha256: string;
  minimumPlatformVersion: string | null;
  dependencies: string[];
  changelog: string | null;
  verified: true;
  latest: boolean;
}
