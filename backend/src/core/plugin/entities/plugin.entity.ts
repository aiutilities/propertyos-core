import { PluginManifest, PluginStatus } from '../types/plugin.types';

export interface PluginEntity {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
}
