import { PluginManifest } from '../../manifest/plugin-manifest.interface';

export function definePlugin<T extends PluginManifest>(plugin: T): T {
  return plugin;
}
