import { ThemeManifest } from '../../types/theme.types';

export type ThemePackageStatus =
  | 'REGISTERED'
  | 'VALIDATED'
  | 'INVALID'
  | 'INSTALLED'
  | 'ARCHIVED';

export interface ThemePackage {
  id: string;
  name: string;
  version: string;
  sourcePath?: string;
  manifest: ThemeManifest;
  status: ThemePackageStatus;
  validationErrors: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
