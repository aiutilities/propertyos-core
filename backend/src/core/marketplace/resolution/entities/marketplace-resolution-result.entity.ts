export type MarketplaceResolutionAction =
  | 'INSTALL'
  | 'UPGRADE'
  | 'ROLLBACK';

export interface MarketplaceResolutionDependency {
  declaration: string;
  name: string;
  installedVersion: string | null;
  satisfied: boolean;
}

export interface MarketplaceResolutionResult {
  slug: string;
  version: string;
  publicationId: string;
  action: MarketplaceResolutionAction;
  executable: boolean;
  platformCompatible: boolean;
  currentPlatformVersion: string;
  minimumPlatformVersion: string | null;
  installedPluginId: string | null;
  installedVersion: string | null;
  dependencies: MarketplaceResolutionDependency[];
  missingDependencies: string[];
  errors: string[];
  warnings: string[];
  executionOrder: string[];
}
