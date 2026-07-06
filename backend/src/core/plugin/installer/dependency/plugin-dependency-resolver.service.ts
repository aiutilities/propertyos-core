import { Injectable } from '@nestjs/common';

@Injectable()
export class PluginDependencyResolverService {
  async resolve(): Promise<string[]> {
    return [];
  }
}
