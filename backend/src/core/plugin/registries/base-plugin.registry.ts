export class BasePluginRegistry<T = unknown> {
  private readonly items = new Map<string, T[]>();

  register(pluginId: string, items: T[] = []): void {
    this.items.set(pluginId, items);
  }

  unregister(pluginId: string): void {
    this.items.delete(pluginId);
  }

  list(): T[] {
    return Array.from(this.items.values()).flat();
  }

  findByPlugin(pluginId: string): T[] {
    return this.items.get(pluginId) ?? [];
  }
}
