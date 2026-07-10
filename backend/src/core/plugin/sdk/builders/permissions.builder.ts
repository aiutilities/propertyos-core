export type PluginPermissionDefinition = {
  code: string;
  name?: string;
  description?: string;
};

export function definePermissions<T extends PluginPermissionDefinition>(
  items: T[],
): T[] {
  return items;
}
