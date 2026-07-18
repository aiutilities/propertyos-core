import { Injectable } from '@nestjs/common';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'fs';
import {
  join,
  resolve,
} from 'path';
import { validatePluginManifest } from '../manifest/plugin-manifest.validator';
import { PluginManifest } from '../manifest/plugin-manifest.interface';
import {
  LoadedPluginRuntimeModule,
  PluginRuntimeModuleLoaderService,
} from './plugin-runtime-module-loader.service';

export type PluginRuntimeBootstrapStatus =
  | 'READY'
  | 'BLOCKED'
  | 'MISSING'
  | 'FAILED';

export interface PluginRuntimeBootstrapCandidate {
  pluginId: string;
  status: PluginRuntimeBootstrapStatus;
  pluginRoot?: string;
  manifest?: PluginManifest;
  runtime?: LoadedPluginRuntimeModule;
  reasons: string[];
}

export interface PluginRuntimeBootstrapPlan {
  requestedPluginIds: string[];
  readyPluginIds: string[];
  blockedPluginIds: string[];
  missingPluginIds: string[];
  failedPluginIds: string[];
  readyToBootstrap: boolean;
  candidates:
    PluginRuntimeBootstrapCandidate[];
}

const SAFE_EXTERNAL_PLUGIN_IDS =
  new Set([
    'agreement',
    'communications',
    'facility',
    'helpdesk',
    'invoice',
    'inventory',
    'maintenance',
    'procurement',
    'receipt',
    'rent',
    'reservation',
    'report',
    'staff',
    'tenant',
    'vehicle',
    'vendor',
  ]);

const EXTERNAL_PLUGIN_DEPENDENCIES:
  Readonly<
    Record<string, readonly string[]>
  > = {
    procurement: [
      'inventory',
    ],
  };

const MONOLITH_BLOCKERS:
  Record<string, string[]> = {
  };

@Injectable()
export class PluginRuntimeBootstrapPlannerService {
  constructor(
    private readonly loader:
      PluginRuntimeModuleLoaderService,
  ) {}

  plan(
    requestedPluginIds:
      readonly string[],
    runtimeRoot: string,
  ): PluginRuntimeBootstrapPlan {
    const requested =
      this.normalizeRequested(
        requestedPluginIds,
      );

    const discovered =
      this.discover(runtimeRoot);

    const candidates =
      requested.map(
        (pluginId) =>
          this.candidate(
            pluginId,
            discovered,
            new Set(
              requested,
            ),
          ),
      );

    const byStatus = (
      status:
        PluginRuntimeBootstrapStatus,
    ): string[] =>
      candidates
        .filter(
          (candidate) =>
            candidate.status ===
              status,
        )
        .map(
          (candidate) =>
            candidate.pluginId,
        );

    return {
      requestedPluginIds:
        requested,
      readyPluginIds:
        byStatus('READY'),
      blockedPluginIds:
        byStatus('BLOCKED'),
      missingPluginIds:
        byStatus('MISSING'),
      failedPluginIds:
        byStatus('FAILED'),
      readyToBootstrap:
        candidates.length > 0 &&
        candidates.every(
          (candidate) =>
            candidate.status ===
              'READY',
        ),
      candidates,
    };
  }

  private candidate(
    pluginId: string,
    discovered:
      Map<
        string,
        {
          pluginRoot: string;
          manifest: PluginManifest;
        }
      >,
    requested:
      ReadonlySet<string>,
  ): PluginRuntimeBootstrapCandidate {
    const dependencies =
      EXTERNAL_PLUGIN_DEPENDENCIES[
        pluginId
      ] ?? [];

    const missingDependencies =
      dependencies.filter(
        (dependency) =>
          !requested.has(
            dependency,
          ),
      );

    if (
      missingDependencies.length > 0
    ) {
      return {
        pluginId,
        status: 'BLOCKED',
        reasons: [
          `External plugin dependencies must ` +
            `also be requested: ` +
            `${missingDependencies.join(', ')}`,
        ],
      };
    }

    const blockers =
      MONOLITH_BLOCKERS[
        pluginId
      ];

    if (blockers) {
      return {
        pluginId,
        status: 'BLOCKED',
        reasons: blockers,
      };
    }

    if (
      !SAFE_EXTERNAL_PLUGIN_IDS.has(
        pluginId,
      )
    ) {
      return {
        pluginId,
        status: 'BLOCKED',
        reasons: [
          `Plugin is not approved for external ` +
            `bootstrap: ${pluginId}`,
        ],
      };
    }

    const plugin =
      discovered.get(pluginId);

    if (!plugin) {
      return {
        pluginId,
        status: 'MISSING',
        reasons: [
          `Installed runtime bundle was not ` +
            `found: ${pluginId}`,
        ],
      };
    }

    try {
      const runtime =
        this.loader.load(
          plugin.pluginRoot,
          plugin.manifest,
        );

      return {
        pluginId,
        status: 'READY',
        pluginRoot:
          plugin.pluginRoot,
        manifest:
          plugin.manifest,
        runtime,
        reasons: [],
      };
    } catch (error) {
      return {
        pluginId,
        status: 'FAILED',
        pluginRoot:
          plugin.pluginRoot,
        manifest:
          plugin.manifest,
        reasons: [
          error instanceof Error
            ? error.message
            : String(error),
        ],
      };
    }
  }

  private discover(
    runtimeRoot: string,
  ): Map<
    string,
    {
      pluginRoot: string;
      manifest: PluginManifest;
    }
  > {
    const plugins =
      new Map<
        string,
        {
          pluginRoot: string;
          manifest: PluginManifest;
        }
      >();

    if (
      !runtimeRoot ||
      !existsSync(runtimeRoot)
    ) {
      return plugins;
    }

    const root = resolve(
      runtimeRoot,
    );

    const directories = [
      root,
      ...readdirSync(
        root,
        {
          withFileTypes: true,
        },
      )
        .filter(
          (entry) =>
            entry.isDirectory(),
        )
        .map(
          (entry) =>
            join(
              root,
              entry.name,
            ),
        ),
    ];

    for (
      const directory
      of directories
    ) {
      const manifestPath =
        join(
          directory,
          'plugin.json',
        );

      if (
        !existsSync(manifestPath)
      ) {
        continue;
      }

      const manifest =
        validatePluginManifest(
          JSON.parse(
            readFileSync(
              manifestPath,
              'utf8',
            ),
          ),
        );

      if (
        plugins.has(
          manifest.id,
        )
      ) {
        throw new Error(
          `Duplicate installed runtime plugin: ` +
            `${manifest.id}`,
        );
      }

      plugins.set(
        manifest.id,
        {
          pluginRoot:
            directory,
          manifest,
        },
      );
    }

    return plugins;
  }

  private normalizeRequested(
    values: readonly string[],
  ): string[] {
    return Array.from(
      new Set(
        values
          .map(
            (value) =>
              value
                .trim()
                .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ).sort();
  }
}
