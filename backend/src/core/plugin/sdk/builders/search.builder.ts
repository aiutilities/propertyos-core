export type PluginSearchDefinition = {
  code: string;
  name: string;
  entityTypes: string[];
  description?: string;
};

export function defineSearchProviders<T extends PluginSearchDefinition>(
  items: T[],
): T[] {
  return items;
}
