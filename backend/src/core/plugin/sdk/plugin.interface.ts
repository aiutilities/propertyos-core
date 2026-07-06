import { PluginContext } from './plugin-context';

export interface PropertyOSPlugin {
  readonly manifest: import('../manifest/plugin-manifest.interface').PluginManifest;

  install?(context: PluginContext): Promise<void>;
  activate?(context: PluginContext): Promise<void>;
  deactivate?(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;
}
