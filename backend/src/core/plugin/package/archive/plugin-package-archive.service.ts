import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

import {
  PluginPackageFile,
  PluginPackageFileType,
} from '../types/plugin-package.types';

@Injectable()
export class PluginPackageArchiveService {
  listFiles(sourcePath: string): PluginPackageFile[] {
    if (!sourcePath || !existsSync(sourcePath)) {
      return [];
    }

    return this.walk(sourcePath).map((filePath) => {
      const stats = statSync(filePath);
      const relativePath = relative(sourcePath, filePath);

      return {
        path: relativePath,
        type: this.inferFileType(relativePath),
        checksum: this.checksum(relativePath),
        sizeBytes: stats.size,
      };
    });
  }

  private walk(root: string): string[] {
    const entries = readdirSync(root, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(root, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.walk(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private inferFileType(path: string): PluginPackageFileType {
    if (path === 'plugin.json') return 'manifest';
    if (path.includes('permissions')) return 'permissions';
    if (path.includes('workflow')) return 'workflows';
    if (path.includes('notifications')) return 'notifications';
    if (path.includes('documents')) return 'documents';
    if (path.includes('configuration')) return 'configuration';
    if (path.includes('scheduler')) return 'scheduler';
    if (path.includes('search')) return 'search';
    if (path.includes('routes')) return 'routes';

    return 'other';
  }

  private checksum(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
