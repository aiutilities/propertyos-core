import {
  MarketplacePlugin,
} from './marketplace-plugin.entity';

export type MarketplacePublisherStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export interface MarketplacePublisherProfile {
  publisherId: string;
  displayName: string;
  status: MarketplacePublisherStatus;
  verified: boolean;
  pluginCount: number;
  latestRelease: Date | null;
  description: string | null;
  homepage: string | null;
  logoUrl: string | null;
  joinedAt: Date;
  updatedAt: Date;
  publicKeyFingerprint: string | null;
}

export interface MarketplacePublisherDetails
  extends MarketplacePublisherProfile {
  plugins: MarketplacePlugin[];
}
