import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  REQUIRED_SCHEMA_ACCEPTANCE,
  SchemaAcceptanceSnapshot,
  validateSchemaAcceptance,
} from './deployment-schema-acceptance';

function validSnapshot():
  SchemaAcceptanceSnapshot {
  return {
    appliedMigrations: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.migrations,
    ],
    relations: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.relations,
    ],
    columns: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.columns,
    ],
    indexes: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.indexes,
    ],
    constraints: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.constraints,
    ],
    functions: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.functions,
    ],
    triggers: [
      ...REQUIRED_SCHEMA_ACCEPTANCE.triggers,
    ],
    corePluginCountBefore: 1,
    corePluginCountAfter: 1,
  };
}

describe('Phase 13D schema acceptance', () => {
  it('accepts the complete expected schema', () => {
    const result =
      validateSchemaAcceptance(validSnapshot());

    expect(result.status).toBe('ACCEPTED');
    expect(result.applyAuthorized).toBe(false);
    expect(result.errors).toEqual([]);
  });

  it('rejects a missing controlled migration', () => {
    const snapshot = validSnapshot();
    const missing =
      snapshot.appliedMigrations.pop();

    const result =
      validateSchemaAcceptance(snapshot);

    expect(result.status).toBe('REJECTED');
    expect(result.missing.migrations)
      .toEqual([missing]);
  });

  it('rejects missing indexes and constraints', () => {
    const snapshot = validSnapshot();
    snapshot.indexes = [];
    snapshot.constraints = [];

    const result =
      validateSchemaAcceptance(snapshot);

    expect(result.status).toBe('REJECTED');
    expect(result.missing.indexes.length)
      .toBeGreaterThan(0);
    expect(result.missing.constraints.length)
      .toBeGreaterThan(0);
  });

  it('rejects changed core plugin row counts', () => {
    const snapshot = validSnapshot();
    snapshot.corePluginCountAfter = 2;

    const result =
      validateSchemaAcceptance(snapshot);

    expect(result.status).toBe('REJECTED');
    expect(result.errors).toContain(
      'core_plugins row count changed during rollout',
    );
  });

  it('rejects a missing immutability trigger', () => {
    const snapshot = validSnapshot();
    snapshot.triggers = [];

    const result =
      validateSchemaAcceptance(snapshot);

    expect(result.status).toBe('REJECTED');
    expect(result.missing.triggers).toEqual([
      'trg_plugin_publication_artifact_immutable',
    ]);
  });
});
