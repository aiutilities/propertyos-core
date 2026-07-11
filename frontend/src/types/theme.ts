export type ThemeStatus =
  | "INSTALLED"
  | "ACTIVE"
  | "INACTIVE"
  | "UNINSTALLED";

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
}

export interface Theme {
  id: string;
  manifest: ThemeManifest;
  status: ThemeStatus;
  installedAt: string;
  activatedAt?: string;
}
