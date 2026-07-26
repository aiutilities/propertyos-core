export interface MarketplacePlugin {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  latestVersion: string;
  description?: string;
  category?: string;
  verified: boolean;
}
