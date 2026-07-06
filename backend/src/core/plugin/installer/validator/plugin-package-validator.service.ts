import { Injectable } from '@nestjs/common';

@Injectable()
export class PluginPackageValidatorService {
  async validate(_path: string): Promise<string[]> {
    return [];
  }
}
