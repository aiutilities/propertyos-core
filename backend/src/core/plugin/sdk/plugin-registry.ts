import { Injectable } from '@nestjs/common';
import { PropertyOSPlugin } from './plugin.interface';

@Injectable()
export class PluginRegistry {
  private readonly plugins = new Map<string, PropertyOSPlugin>();

  register(plugin: PropertyOSPlugin): void {
    this.plugins.set(plugin.manifest.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  get(id: string): PropertyOSPlugin | undefined {
    return this.plugins.get(id);
  }

  list(): PropertyOSPlugin[] {
    return [...this.plugins.values()];
  }
}
