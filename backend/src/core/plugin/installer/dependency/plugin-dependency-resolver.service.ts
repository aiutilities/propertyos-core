import { Injectable } from '@nestjs/common';

@Injectable()
export class PluginDependencyResolverService {
  async resolve(): Promise<string[]> {
    return [];
  }

  async resolveManifestDependencies(
    dependencies: string[] = [],
    installedPlugins: string[] = [],
  ): Promise<string[]> {
    return dependencies.filter(
      (dependency) => !installedPlugins.includes(dependency),
    );
  }
}
