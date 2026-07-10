import { Injectable } from '@nestjs/common';
import { PluginRegistry } from './plugin-registry';
import { PropertyOSPlugin } from './plugin.interface';

@Injectable()
export class PluginLoader {
  constructor(private readonly registry: PluginRegistry) {}

  load(plugin: PropertyOSPlugin): void {
    this.registry.register(plugin);
  }

  unload(pluginId: string): void {
    this.registry.unregister(pluginId);
  }
}
