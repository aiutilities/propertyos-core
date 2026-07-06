import { PluginManifest } from '../types/plugin.types';

export class UpgradePluginDto {
  version!: string;
  manifest?: PluginManifest;
  notes?: string;
}
