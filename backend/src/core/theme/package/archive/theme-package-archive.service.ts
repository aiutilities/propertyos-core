import { Injectable } from '@nestjs/common';

@Injectable()
export class ThemePackageArchiveService {
  normalizeSourcePath(sourcePath?: string): string | undefined {
    return sourcePath?.trim() || undefined;
  }
}
