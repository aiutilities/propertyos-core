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
