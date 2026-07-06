import { Injectable } from '@nestjs/common';
import { PluginLoader } from './plugin-loader';
import { HookManager } from './hook-manager';
import { PropertyOSPlugin } from './plugin.interface';

@Injectable()
export class PluginManager {
  constructor(
    private readonly loader: PluginLoader,
    private readonly hooks: HookManager,
  ) {}

  async install(plugin: PropertyOSPlugin): Promise<void> {
    await this.hooks.execute('before.install', plugin.manifest);
    this.loader.load(plugin);
    await this.hooks.execute('after.install', plugin.manifest);
  }
}
