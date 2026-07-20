import {
  mkdtempSync,
  mkdirSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  IsolatedRuntimeContainmentAdapter,
  IsolatedRuntimeState,
} from './plugin-runtime-containment-isolated-adapter';
import {
  RuntimeContainmentSecurityEvent,
} from './plugin-runtime-containment-executor';

const roots: string[] = [];

function harness() {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'propertyos-containment-',
    ),
  );
  roots.push(root);

  const sourceRuntimeRoot =
    join(root, 'source-runtime');
  const isolatedRuntimeRoot =
    join(root, 'isolated-runtime');

  mkdirSync(sourceRuntimeRoot);
  mkdirSync(isolatedRuntimeRoot);

  const adapter =
    new IsolatedRuntimeContainmentAdapter({
      environmentClass: 'ISOLATED',
      environmentId:
        'containment-exercise-001',
      sourceRuntimeRoot,
      isolatedRuntimeRoot,
    });

  const state: IsolatedRuntimeState = {
    schemaVersion: 1,
    environmentClass: 'ISOLATED',
    environmentId:
      'containment-exercise-001',
    plugins: [
      {
        pluginId: 'propertyos.visitor',
        installed: true,
        active: true,
        isolated: false,
        version: '1.0.0',
      },
      {
        pluginId: 'propertyos.helpdesk',
        installed: true,
        active: true,
        isolated: false,
        version: '2.0.0',
      },
    ],
  };

  adapter.initialize(state);

  return {
    adapter,
    sourceRuntimeRoot,
    isolatedRuntimeRoot,
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

describe(
  'Phase 13E isolated runtime containment adapter',
  () => {
    it('persists isolation and deactivation in disposable state', async () => {
      const test = harness();

      const before =
        await test.adapter.inspectRuntime(
          'propertyos.visitor',
        );

      await test.adapter.isolateRuntime({
        pluginId: 'propertyos.visitor',
        incidentId: 'incident-001',
        actorId: 'operator-001',
      });

      await test.adapter.deactivateRuntime({
        pluginId: 'propertyos.visitor',
        incidentId: 'incident-001',
        actorId: 'operator-001',
      });

      const after =
        await test.adapter.inspectRuntime(
          'propertyos.visitor',
        );

      expect(before.active).toBe(true);
      expect(before.isolated).toBe(false);
      expect(after.active).toBe(false);
      expect(after.isolated).toBe(true);
      expect(after.runtimeSnapshotSha256)
        .not.toBe(
          before.runtimeSnapshotSha256,
        );
      expect(after.unrelatedPluginStateSha256)
        .toBe(
          before.unrelatedPluginStateSha256,
        );
    });

    it('leaves unrelated plugin state unchanged', async () => {
      const test = harness();

      const unrelatedBefore =
        await test.adapter.inspectRuntime(
          'propertyos.helpdesk',
        );

      await test.adapter.isolateRuntime({
        pluginId: 'propertyos.visitor',
        incidentId: 'incident-001',
        actorId: 'operator-001',
      });

      await test.adapter.deactivateRuntime({
        pluginId: 'propertyos.visitor',
        incidentId: 'incident-001',
        actorId: 'operator-001',
      });

      const unrelatedAfter =
        await test.adapter.inspectRuntime(
          'propertyos.helpdesk',
        );

      expect(unrelatedAfter.pluginId).toBe(
        unrelatedBefore.pluginId,
      );
      expect(unrelatedAfter.installed).toBe(
        unrelatedBefore.installed,
      );
      expect(unrelatedAfter.active).toBe(
        unrelatedBefore.active,
      );
      expect(unrelatedAfter.isolated).toBe(
        unrelatedBefore.isolated,
      );
      expect(
        unrelatedAfter.runtimeSnapshotSha256,
      ).toBe(
        unrelatedBefore.runtimeSnapshotSha256,
      );

      expect(
        unrelatedAfter
          .unrelatedPluginStateSha256,
      ).not.toBe(
        unrelatedBefore
          .unrelatedPluginStateSha256,
      );
    });

    it('persists ordered audit events', async () => {
      const test = harness();

      const first:
        RuntimeContainmentSecurityEvent = {
        eventType: 'CONTAINMENT_STARTED',
        pluginId: 'propertyos.visitor',
        incidentId: 'incident-001',
        executionRequestSha256:
          'a'.repeat(64),
        actorId: 'operator-001',
        occurredAt:
          '2026-07-20T10:00:00.000Z',
        detail: 'started',
      };

      const second = {
        ...first,
        eventType:
          'RUNTIME_ISOLATED' as const,
        detail: 'isolated',
      };

      await test.adapter
        .recordSecurityEvent(first);
      await test.adapter
        .recordSecurityEvent(second);

      expect(
        test.adapter
          .readAuditEvents()
          .map((event) => event.eventType),
      ).toEqual([
        'CONTAINMENT_STARTED',
        'RUNTIME_ISOLATED',
      ]);
    });

    it('blocks production through an unsafe cast', () => {
      const test = harness();

      expect(
        () =>
          new IsolatedRuntimeContainmentAdapter({
            environmentClass:
              'PRODUCTION' as 'ISOLATED',
            environmentId:
              'production',
            sourceRuntimeRoot:
              test.sourceRuntimeRoot,
            isolatedRuntimeRoot:
              join(
                test.isolatedRuntimeRoot,
                'forbidden',
              ),
          }),
      ).toThrow(
        'RUNTIME_CONTAINMENT_ENVIRONMENT_FORBIDDEN',
      );
    });

    it('blocks identical source and target roots', () => {
      const test = harness();

      expect(
        () =>
          new IsolatedRuntimeContainmentAdapter({
            environmentClass: 'ISOLATED',
            environmentId:
              'containment-exercise-002',
            sourceRuntimeRoot:
              test.sourceRuntimeRoot,
            isolatedRuntimeRoot:
              test.sourceRuntimeRoot,
          }),
      ).toThrow(
        'RUNTIME_CONTAINMENT_SOURCE_TARGET_MUST_BE_DISJOINT',
      );
    });

    it('blocks an isolated root nested inside the source root', () => {
      const test = harness();

      expect(
        () =>
          new IsolatedRuntimeContainmentAdapter({
            environmentClass: 'ISOLATED',
            environmentId:
              'containment-exercise-003',
            sourceRuntimeRoot:
              test.sourceRuntimeRoot,
            isolatedRuntimeRoot:
              join(
                test.sourceRuntimeRoot,
                'nested-isolated-runtime',
              ),
          }),
      ).toThrow(
        'RUNTIME_CONTAINMENT_SOURCE_TARGET_MUST_BE_DISJOINT',
      );
    });

    it('blocks duplicate initialization', () => {
      const test = harness();

      expect(
        () =>
          test.adapter.initialize({
            schemaVersion: 1,
            environmentClass: 'ISOLATED',
            environmentId:
              'containment-exercise-001',
            plugins: [],
          }),
      ).toThrow(
        'ISOLATED_RUNTIME_STATE_ALREADY_INITIALIZED',
      );
    });
  },
);
