import { PluginManifest } from '../manifest/plugin-manifest.interface';

export type PluginStatus = 'DISCOVERED' | 'ACTIVE' | 'DISABLED' | 'FAILED';

export interface PluginRegistryEntry {
  manifest: PluginManifest;
  status: PluginStatus;
  error?: string;

  validation?: {
    compatible: boolean;
    dependenciesSatisfied: boolean;
    errors: string[];
  };

  loadReport?: string[];
}

export interface PluginContext {
  pluginId: string;
  manifest: PluginManifest;
}

export interface PluginBootstrap {
  register(context: PluginContext): Promise<void> | void;
}

export { PluginManifest };
