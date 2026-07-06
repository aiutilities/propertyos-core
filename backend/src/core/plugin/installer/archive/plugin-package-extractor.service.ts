import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { PluginZipExtractorService } from '../extractor/plugin-zip-extractor.service';

@Injectable()
export class PluginPackageExtractorService {
  constructor(
    private readonly zipExtractor: PluginZipExtractorService,
  ) {}

  async extract(packagePath: string): Promise<string> {
    if (extname(packagePath).toLowerCase() === '.zip') {
      return this.zipExtractor.extract(packagePath);
    }

    return packagePath;
  }
}
