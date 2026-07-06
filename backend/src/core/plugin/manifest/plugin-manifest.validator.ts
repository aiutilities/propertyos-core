import { PluginManifest } from './plugin-manifest.interface';

export function validatePluginManifest(manifest: unknown): PluginManifest {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Invalid plugin manifest');
  }

  const item = manifest as Partial<PluginManifest>;

  for (const field of ['id', 'name', 'version', 'provider'] as const) {
    if (!item[field] || typeof item[field] !== 'string') {
      throw new Error(`Plugin manifest missing required field: ${field}`);
    }
  }

  return {
    enabled: true,
    permissions: [],
    workflows: [],
    notifications: [],
    documents: [],
    search: [],
    configuration: [],
    scheduler: [],
    routes: [],
    ...item,
  } as PluginManifest;
}
