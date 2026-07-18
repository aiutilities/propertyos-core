import {
  Injectable,
  Type,
} from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import {
  existsSync,
  realpathSync,
  statSync,
} from 'fs';
import {
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'path';
import { PluginManifest } from '../manifest/plugin-manifest.interface';

export interface LoadedPluginRuntimeModule {
  pluginId: string;
  moduleClassName: string;
  entrypoint: string;
  moduleClass: Type<unknown>;
  exportNames: string[];
}

export class PluginRuntimeModuleLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginRuntimeModuleLoadError';
  }
}

@Injectable()
export class PluginRuntimeModuleLoaderService {
  private readonly modules = new Map<
    string,
    LoadedPluginRuntimeModule
  >();

  load(
    pluginRoot: string,
    manifest: PluginManifest,
  ): LoadedPluginRuntimeModule {
    const existing = this.modules.get(
      manifest.id,
    );

    const entrypoint = this.resolveEntrypoint(
      pluginRoot,
      manifest,
    );

    if (existing) {
      if (
        existing.entrypoint !== entrypoint ||
        existing.moduleClassName !==
          manifest.moduleClass
      ) {
        throw new PluginRuntimeModuleLoadError(
          `Plugin runtime already loaded with a different ` +
            `entrypoint or module class: ${manifest.id}`,
        );
      }

      return existing;
    }

    const moduleClassName =
      this.validateModuleClassName(
        manifest,
      );

    let imported: unknown;

    try {
      // Runtime bundles are CommonJS artifacts produced by
      // the standalone plugin workspace build.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      imported = require(entrypoint);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      throw new PluginRuntimeModuleLoadError(
        `Unable to import runtime entrypoint for ` +
          `${manifest.id}: ${message}`,
      );
    }

    if (
      !imported ||
      typeof imported !== 'object'
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Runtime entrypoint did not export an object: ` +
          `${manifest.id}`,
      );
    }

    const exportsObject = imported as Record<
      string,
      unknown
    >;

    const candidate =
      exportsObject[moduleClassName];

    if (typeof candidate !== 'function') {
      throw new PluginRuntimeModuleLoadError(
        `Runtime entrypoint does not export ` +
          `${moduleClassName}: ${manifest.id}`,
      );
    }

    const moduleClass =
      candidate as Type<unknown>;

    if (!this.isNestModule(moduleClass)) {
      throw new PluginRuntimeModuleLoadError(
        `Runtime export is not a NestJS module: ` +
          `${moduleClassName}`,
      );
    }

    const loaded: LoadedPluginRuntimeModule = {
      pluginId: manifest.id,
      moduleClassName,
      entrypoint,
      moduleClass,
      exportNames: Object.keys(
        exportsObject,
      ).sort(),
    };

    this.modules.set(
      manifest.id,
      loaded,
    );

    return loaded;
  }

  get(
    pluginId: string,
  ): LoadedPluginRuntimeModule | undefined {
    return this.modules.get(pluginId);
  }

  list(): LoadedPluginRuntimeModule[] {
    return Array.from(
      this.modules.values(),
    );
  }

  has(pluginId: string): boolean {
    return this.modules.has(pluginId);
  }

  unload(pluginId: string): boolean {
    return this.modules.delete(pluginId);
  }

  private resolveEntrypoint(
    pluginRoot: string,
    manifest: PluginManifest,
  ): string {
    if (
      !pluginRoot ||
      !existsSync(pluginRoot)
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin root does not exist: ${pluginRoot}`,
      );
    }

    const root = realpathSync(
      pluginRoot,
    );

    if (!statSync(root).isDirectory()) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin root is not a directory: ${pluginRoot}`,
      );
    }

    const requested =
      manifest.entrypoint ||
      manifest.bootstrap;

    if (!requested) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint is missing: ` +
          `${manifest.id}`,
      );
    }

    if (
      isAbsolute(requested) ||
      requested.includes('\\')
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint must be a portable ` +
          `relative path: ${requested}`,
      );
    }

    if (
      extname(requested).toLowerCase() !==
      '.js'
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint must be compiled ` +
          `JavaScript: ${requested}`,
      );
    }

    const candidate = resolve(
      root,
      requested,
    );

    if (!this.isInside(root, candidate)) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint escapes the plugin ` +
          `root: ${requested}`,
      );
    }

    if (!existsSync(candidate)) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint does not exist: ` +
          `${requested}`,
      );
    }

    const resolvedCandidate =
      realpathSync(candidate);

    if (
      !this.isInside(
        root,
        resolvedCandidate,
      )
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint resolves outside the ` +
          `plugin root: ${requested}`,
      );
    }

    if (
      !statSync(
        resolvedCandidate,
      ).isFile()
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime entrypoint is not a file: ` +
          `${requested}`,
      );
    }

    return resolvedCandidate;
  }

  private validateModuleClassName(
    manifest: PluginManifest,
  ): string {
    const moduleClassName =
      manifest.moduleClass;

    if (
      !moduleClassName ||
      !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(
        moduleClassName,
      )
    ) {
      throw new PluginRuntimeModuleLoadError(
        `Plugin runtime moduleClass is invalid: ` +
          `${manifest.id}`,
      );
    }

    return moduleClassName;
  }

  private isNestModule(
    moduleClass: Type<unknown>,
  ): boolean {
    return [
      MODULE_METADATA.IMPORTS,
      MODULE_METADATA.PROVIDERS,
      MODULE_METADATA.CONTROLLERS,
      MODULE_METADATA.EXPORTS,
    ].some(
      (metadataKey) =>
        Reflect.hasMetadata(
          metadataKey,
          moduleClass,
        ),
    );
  }

  private isInside(
    root: string,
    candidate: string,
  ): boolean {
    const pathFromRoot = relative(
      root,
      candidate,
    );

    return (
      pathFromRoot === '' ||
      (
        !pathFromRoot.startsWith('..') &&
        !isAbsolute(pathFromRoot)
      )
    );
  }
}
