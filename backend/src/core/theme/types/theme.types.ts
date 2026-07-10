export type ThemeStatus = 'INSTALLED' | 'ACTIVE' | 'INACTIVE' | 'UNINSTALLED';

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  layouts?: string[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface ThemeEntity {
  id: string;
  manifest: ThemeManifest;
  status: ThemeStatus;
  installedAt: Date;
  activatedAt?: Date;
}
