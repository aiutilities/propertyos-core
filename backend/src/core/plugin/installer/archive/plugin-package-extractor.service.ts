import { Injectable } from '@nestjs/common';

@Injectable()
export class PluginPackageExtractorService {
  async extract(packagePath: string): Promise<string> {
    return packagePath;
  }
}
