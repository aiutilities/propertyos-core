import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PluginDiscoveryService {
  discover(pluginRoot: string): string {
    const manifest = join(pluginRoot, 'plugin.json');

    if (!existsSync(manifest)) {
      throw new Error('plugin.json not found');
    }

    return pluginRoot;
  }
}
