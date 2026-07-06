import { Injectable } from '@nestjs/common';
import { existsSync, rmSync } from 'fs';

@Injectable()
export class PluginInstallationRollbackService {
  rollback(path: string): void {
    if (existsSync(path)) {
      rmSync(path, {
        recursive: true,
        force: true,
      });
    }
  }
}
