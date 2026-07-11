export type ThemeStatus =
  | "INSTALLED"
  | "ACTIVE"
  | "INACTIVE"
  | "UNINSTALLED";

export interface ThemeBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  layouts?: string[];
  branding?: ThemeBranding;
}

export interface Theme {
  id: string;
  manifest: ThemeManifest;
  status: ThemeStatus;
  installedAt: string;
  activatedAt?: string;
}

export type ThemePackageStatus =
  | "REGISTERED"
  | "VALIDATED"
  | "INVALID"
  | "INSTALLED"
  | "ARCHIVED";

export interface ThemePackage {
  id: string;
  name: string;
  version: string;
  sourcePath?: string;
  manifest: ThemeManifest;
  status: ThemePackageStatus;
  validationErrors: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

