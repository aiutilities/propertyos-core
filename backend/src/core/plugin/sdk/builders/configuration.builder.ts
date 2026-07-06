export type PluginConfigurationDefinition = {
  code: string;
  key?: string;
  name?: string;
  description?: string;
  defaultValue?: unknown;
  schema?: Record<string, unknown>;
};

export function defineConfiguration<T extends PluginConfigurationDefinition>(
  items: T[],
): T[] {
  return items;
}
