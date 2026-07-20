import { createHash } from 'crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'fs';
import {
  isAbsolute,
  join,
  relative,
  resolve,
} from 'path';
import {
  RuntimeContainmentExecutorPorts,
  RuntimeContainmentObservation,
  RuntimeContainmentSecurityEvent,
} from './plugin-runtime-containment-executor';

export interface IsolatedRuntimePluginState {
  pluginId: string;
  installed: boolean;
  active: boolean;
  isolated: boolean;
  version: string;
}

export interface IsolatedRuntimeState {
  schemaVersion: 1;
  environmentClass: 'ISOLATED';
  environmentId: string;
  plugins: IsolatedRuntimePluginState[];
}

export interface IsolatedRuntimeAdapterOptions {
  environmentClass: 'ISOLATED';
  environmentId: string;
  sourceRuntimeRoot: string;
  isolatedRuntimeRoot: string;
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex');
}

function sortedPlugins(
  plugins:
    readonly IsolatedRuntimePluginState[],
): IsolatedRuntimePluginState[] {
  return [...plugins].sort(
    (left, right) =>
      left.pluginId.localeCompare(
        right.pluginId,
      ),
  );
}

export class IsolatedRuntimeContainmentAdapter
implements RuntimeContainmentExecutorPorts {
  private readonly statePath: string;
  private readonly auditPath: string;

  constructor(
    private readonly options:
      IsolatedRuntimeAdapterOptions,
  ) {
    this.assertIsolatedOptions();

    mkdirSync(
      this.options.isolatedRuntimeRoot,
      { recursive: true },
    );

    this.statePath = join(
      this.options.isolatedRuntimeRoot,
      'runtime-state.json',
    );
    this.auditPath = join(
      this.options.isolatedRuntimeRoot,
      'containment-audit.jsonl',
    );
  }

  initialize(
    state: IsolatedRuntimeState,
  ): void {
    if (existsSync(this.statePath)) {
      throw new Error(
        'ISOLATED_RUNTIME_STATE_ALREADY_INITIALIZED',
      );
    }

    this.assertState(state);
    this.writeState(state);
  }

  async inspectRuntime(
    pluginId: string,
  ): Promise<RuntimeContainmentObservation> {
    const state = this.readState();
    const plugin = state.plugins.find(
      (candidate) =>
        candidate.pluginId === pluginId,
    );

    if (!plugin) {
      throw new Error(
        `ISOLATED_RUNTIME_PLUGIN_NOT_FOUND:${pluginId}`,
      );
    }

    const unrelated = sortedPlugins(
      state.plugins.filter(
        (candidate) =>
          candidate.pluginId !== pluginId,
      ),
    );

    return {
      pluginId: plugin.pluginId,
      installed: plugin.installed,
      active: plugin.active,
      isolated: plugin.isolated,
      runtimeSnapshotSha256:
        sha256(plugin),
      unrelatedPluginStateSha256:
        sha256(unrelated),
    };
  }

  async isolateRuntime(input: {
    pluginId: string;
    incidentId: string;
    actorId: string;
  }): Promise<void> {
    this.updatePlugin(
      input.pluginId,
      (plugin) => ({
        ...plugin,
        isolated: true,
      }),
    );
  }

  async deactivateRuntime(input: {
    pluginId: string;
    incidentId: string;
    actorId: string;
  }): Promise<void> {
    this.updatePlugin(
      input.pluginId,
      (plugin) => ({
        ...plugin,
        active: false,
      }),
    );
  }

  async recordSecurityEvent(
    event: RuntimeContainmentSecurityEvent,
  ): Promise<void> {
    appendFileSync(
      this.auditPath,
      `${JSON.stringify(event)}\n`,
      {
        encoding: 'utf8',
        flag: 'a',
      },
    );
  }

  readAuditEvents():
    RuntimeContainmentSecurityEvent[] {
    if (!existsSync(this.auditPath)) {
      return [];
    }

    const content =
      readFileSync(
        this.auditPath,
        'utf8',
      ).trim();

    if (!content) {
      return [];
    }

    return content
      .split('\n')
      .map(
        (line) =>
          JSON.parse(line) as
            RuntimeContainmentSecurityEvent,
      );
  }

  private assertIsolatedOptions(): void {
    if (
      this.options.environmentClass !==
      'ISOLATED'
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_ENVIRONMENT_FORBIDDEN',
      );
    }

    if (
      !IDENTIFIER_PATTERN.test(
        this.options.environmentId,
      )
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_ENVIRONMENT_INVALID',
      );
    }

    if (
      !this.options.sourceRuntimeRoot ||
      !this.options.isolatedRuntimeRoot
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_ROOT_REQUIRED',
      );
    }

    const sourceRoot =
      resolve(this.options.sourceRuntimeRoot);
    const isolatedRoot =
      resolve(this.options.isolatedRuntimeRoot);

    const isolatedRelativeToSource =
      relative(sourceRoot, isolatedRoot);
    const sourceRelativeToIsolated =
      relative(isolatedRoot, sourceRoot);

    const isolatedInsideSource =
      isolatedRelativeToSource !== '' &&
      !isolatedRelativeToSource.startsWith('..') &&
      !isAbsolute(isolatedRelativeToSource);

    const sourceInsideIsolated =
      sourceRelativeToIsolated !== '' &&
      !sourceRelativeToIsolated.startsWith('..') &&
      !isAbsolute(sourceRelativeToIsolated);

    if (
      sourceRoot === isolatedRoot ||
      isolatedInsideSource ||
      sourceInsideIsolated
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_SOURCE_TARGET_MUST_BE_DISJOINT',
      );
    }

    if (
      existsSync(sourceRoot) &&
      existsSync(isolatedRoot) &&
      realpathSync(sourceRoot) ===
        realpathSync(isolatedRoot)
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_SOURCE_TARGET_MUST_BE_DISJOINT',
      );
    }
  }

  private assertState(
    state: IsolatedRuntimeState,
  ): void {
    if (
      state.schemaVersion !== 1 ||
      state.environmentClass !==
        'ISOLATED' ||
      state.environmentId !==
        this.options.environmentId
    ) {
      throw new Error(
        'ISOLATED_RUNTIME_STATE_INVALID',
      );
    }

    const ids =
      state.plugins.map(
        (plugin) => plugin.pluginId,
      );

    if (
      ids.some(
        (id) =>
          !IDENTIFIER_PATTERN.test(id),
      ) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error(
        'ISOLATED_RUNTIME_PLUGIN_INVENTORY_INVALID',
      );
    }

    for (const plugin of state.plugins) {
      if (
        plugin.active &&
        !plugin.installed
      ) {
        throw new Error(
          'ISOLATED_RUNTIME_PLUGIN_STATE_INVALID',
        );
      }
    }
  }

  private readState(): IsolatedRuntimeState {
    if (!existsSync(this.statePath)) {
      throw new Error(
        'ISOLATED_RUNTIME_STATE_NOT_INITIALIZED',
      );
    }

    const state =
      JSON.parse(
        readFileSync(
          this.statePath,
          'utf8',
        ),
      ) as IsolatedRuntimeState;

    this.assertState(state);
    return state;
  }

  private writeState(
    state: IsolatedRuntimeState,
  ): void {
    const normalized: IsolatedRuntimeState = {
      ...state,
      plugins:
        sortedPlugins(state.plugins),
    };

    const temporaryPath =
      `${this.statePath}.tmp`;

    writeFileSync(
      temporaryPath,
      `${JSON.stringify(
        normalized,
        null,
        2,
      )}\n`,
      {
        encoding: 'utf8',
        flag: 'w',
      },
    );

    renameSync(
      temporaryPath,
      this.statePath,
    );
  }

  private updatePlugin(
    pluginId: string,
    update: (
      plugin: IsolatedRuntimePluginState,
    ) => IsolatedRuntimePluginState,
  ): void {
    const state = this.readState();
    let found = false;

    const plugins =
      state.plugins.map((plugin) => {
        if (plugin.pluginId !== pluginId) {
          return plugin;
        }

        found = true;
        return update(plugin);
      });

    if (!found) {
      throw new Error(
        `ISOLATED_RUNTIME_PLUGIN_NOT_FOUND:${pluginId}`,
      );
    }

    const updated = {
      ...state,
      plugins,
    };

    this.assertState(updated);
    this.writeState(updated);
  }
}
