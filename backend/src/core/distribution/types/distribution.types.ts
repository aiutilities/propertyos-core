export type DistributionStatus =
  | 'REGISTERED'
  | 'INSTALLED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED';

export type DistributionCategory =
  | 'COMMUNITY'
  | 'COMMERCIAL'
  | 'COWORKING'
  | 'CAMPUS'
  | 'INDUSTRIAL'
  | 'CUSTOM';

export interface DistributionManifest {
  name: string;
  displayName: string;
  version: string;
  category: DistributionCategory;
  description?: string;
  requiredPlugins?: string[];
  recommendedPlugins?: string[];
  requiredThemes?: string[];
  defaultTheme?: string;
  defaultSettings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Distribution {
  id: string;
  name: string;
  displayName: string;
  version: string;
  category: DistributionCategory;
  manifest: DistributionManifest;
  status: DistributionStatus;
  installedAt?: Date;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
