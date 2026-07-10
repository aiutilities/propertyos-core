import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PluginDiscoveryService {
  discover(pluginRoot: string): string {
    const directManifest = join(pluginRoot, 'plugin.json');

    if (existsSync(directManifest)) {
      return pluginRoot;
    }

    const childDirectories = readdirSync(pluginRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(pluginRoot, entry.name));

    for (const childDirectory of childDirectories) {
      if (existsSync(join(childDirectory, 'plugin.json'))) {
        return childDirectory;
      }
    }

    throw new Error('plugin.json not found');
  }
}
