import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync } from 'fs';
import { basename, join } from 'path';

@Injectable()
export class PluginZipExtractorService {
  extract(zipFile: string): string {
    if (!existsSync(zipFile)) {
      throw new Error(`Plugin package not found: ${zipFile}`);
    }

    const output = join(
      process.cwd(),
      'plugins',
      '.installed',
      basename(zipFile, '.zip'),
    );

    mkdirSync(output, { recursive: true });

    const zip = new AdmZip(zipFile);
    zip.extractAllTo(output, true);

    return output;
  }
}
