export interface MarketplacePlugin {
  id: string;
  pluginId: string | null;
  slug: string;
  name: string;
  vendor: string;
  latestVersion: string;
  description: string | null;
  category: string | null;
  iconUrl: string | null;
  homepage: string | null;
  repository: string | null;
  verified: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
