import {
  PluginInstallationProvenance,
} from '../installer/types/plugin-installer.types';

export type PluginStatus =
  | 'INSTALLED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNINSTALLED';

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  minPlatformVersion?: string;
  installationProvenance?:
    PluginInstallationProvenance;
}
