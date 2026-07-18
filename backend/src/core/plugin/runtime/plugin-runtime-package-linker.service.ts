import {
  Injectable,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  realpathSync,
  symlinkSync,
} from 'fs';
import {
  isAbsolute,
  join,
  relative,
  resolve,
} from 'path';

export interface PluginRuntimePackageLink {
  pluginId: string;
  packageName: string;
  pluginRoot: string;
  linkPath: string;
}

export class PluginRuntimePackageLinkError
  extends Error
{
  constructor(message: string) {
    super(message);
    this.name =
      'PluginRuntimePackageLinkError';
  }
}

@Injectable()
export class PluginRuntimePackageLinkerService {
  prepare(
    runtimeRoot: string,
    requestedPluginIds:
      readonly string[],
  ): PluginRuntimePackageLink[] {
    if (
      !runtimeRoot ||
      !existsSync(runtimeRoot)
    ) {
      return [];
    }

    const root =
      realpathSync(
        runtimeRoot,
      );

    const scopeRoot =
      join(
        root,
        'node_modules',
        '@propertyos',
      );

    const links:
      PluginRuntimePackageLink[] = [];

    for (
      const pluginId
      of Array.from(
        new Set(
          requestedPluginIds,
        ),
      ).sort()
    ) {
      this.validatePluginId(
        pluginId,
      );

      const candidate =
        resolve(
          root,
          pluginId,
        );

      if (
        !this.isInside(
          root,
          candidate,
        ) ||
        !existsSync(candidate)
      ) {
        continue;
      }

      const pluginRoot =
        realpathSync(
          candidate,
        );

      if (
        !this.isInside(
          root,
          pluginRoot,
        )
      ) {
        throw new PluginRuntimePackageLinkError(
          `Runtime plugin root escapes the ` +
            `runtime root: ${pluginId}`,
        );
      }

      const packageJson =
        join(
          pluginRoot,
          'package.json',
        );

      if (
        !existsSync(packageJson)
      ) {
        throw new PluginRuntimePackageLinkError(
          `Runtime plugin package metadata is ` +
            `missing: ${pluginId}`,
        );
      }

      mkdirSync(
        scopeRoot,
        {
          recursive: true,
        },
      );

      const linkPath =
        join(
          scopeRoot,
          `plugin-${pluginId}`,
        );

      if (
        existsSync(linkPath)
      ) {
        const existing =
          realpathSync(
            linkPath,
          );

        if (
          existing !== pluginRoot
        ) {
          throw new PluginRuntimePackageLinkError(
            `Runtime package link conflicts with ` +
              `another target: ` +
              `@propertyos/plugin-${pluginId}`,
          );
        }
      } else {
        symlinkSync(
          pluginRoot,
          linkPath,
          'dir',
        );
      }

      links.push({
        pluginId,
        packageName:
          `@propertyos/plugin-${pluginId}`,
        pluginRoot,
        linkPath,
      });
    }

    return links;
  }

  private validatePluginId(
    pluginId: string,
  ): void {
    if (
      !/^[a-z][a-z0-9-]*$/.test(
        pluginId,
      )
    ) {
      throw new PluginRuntimePackageLinkError(
        `Runtime plugin ID is invalid: ` +
          `${pluginId}`,
      );
    }
  }

  private isInside(
    root: string,
    candidate: string,
  ): boolean {
    const pathFromRoot =
      relative(
        root,
        candidate,
      );

    return (
      pathFromRoot === '' ||
      (
        !pathFromRoot.startsWith(
          '..',
        ) &&
        !isAbsolute(
          pathFromRoot,
        )
      )
    );
  }
}
