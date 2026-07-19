import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  generateKeyPairSync,
} from 'crypto';
import {
  Pool,
} from 'pg';
import {
  PluginTrustBootstrapExecutor,
  TrustBootstrapAuthorization,
} from './plugin-trust-bootstrap-executor';
import {
  buildTrustBootstrapPlan,
  ExistingTrustBootstrapState,
  TrustBootstrapInput,
} from './plugin-trust-bootstrap-plan';

function publicKeyPem(): string {
  const {
    publicKey,
  } = generateKeyPairSync(
    'rsa',
    {
      modulusLength: 2048,
    },
  );

  return String(
    publicKey.export({
      type: 'spki',
      format: 'pem',
    }),
  );
}

function input(): TrustBootstrapInput {
  return {
    environmentId:
      'propertyos-staging',
    keyId:
      'propertyos-release-2026-01',
    publicKeyPem: publicKeyPem(),
    actorId:
      'deployment-operator',
    validFrom:
      '2026-07-19T00:00:00.000Z',
    evidenceTimestamp:
      '2026-07-19T16:00:00.000Z',
  };
}

function authorization(
  desired: TrustBootstrapInput,
): TrustBootstrapAuthorization {
  const plan =
    buildTrustBootstrapPlan(desired);

  if (!plan.evidenceSha256) {
    throw new Error(
      'Expected bootstrap evidence',
    );
  }

  return {
    approvalId:
      'bootstrap-approval-001',
    approvedBy:
      'deployment-approver',
    approvedAt:
      '2026-07-19T16:05:00.000Z',
    expectedEvidenceSha256:
      plan.evidenceSha256,
  };
}

function matchingState(
  desired: TrustBootstrapInput,
): ExistingTrustBootstrapState {
  const plan =
    buildTrustBootstrapPlan(desired);

  if (!plan.key) {
    throw new Error(
      'Expected canonical key',
    );
  }

  return {
    publisher: {
      publisherId: 'propertyos',
      displayName: 'PropertyOS',
      status: 'ACTIVE',
    },
    key: {
      keyId: plan.key.keyId,
      publisherId: 'propertyos',
      status: 'ACTIVE',
      algorithm: plan.key.algorithm,
      publicKeyPem: plan.key.publicKeyPem,
      fingerprintSha256:
        plan.key.fingerprintSha256,
      validFrom: plan.key.validFrom,
      validUntil: plan.key.validUntil,
    },
  };
}

function harness(options?: {
  existing?: ExistingTrustBootstrapState;
  failPublisherInsert?: boolean;
}) {
  const existing = options?.existing ?? {};
  const calls: Array<{
    text: string;
    values?: unknown[];
  }> = [];

  const client = {
    query: jest.fn(
      async (
        text: string,
        values?: unknown[],
      ) => {
        calls.push({ text, values });

        if (
          text.includes(
            'SELECT\n          id,',
          )
        ) {
          return {
            rows: existing.publisher
              ? [{
                  id:
                    existing.publisher.publisherId,
                  display_name:
                    existing.publisher.displayName,
                  status:
                    existing.publisher.status,
                }]
              : [],
          };
        }

        if (
          text.includes(
            'FROM plugin_publisher_keys',
          ) &&
          text.includes('FOR UPDATE')
        ) {
          return {
            rows: existing.key
              ? [{
                  key_id:
                    existing.key.keyId,
                  publisher_id:
                    existing.key.publisherId,
                  status:
                    existing.key.status,
                  algorithm:
                    existing.key.algorithm,
                  public_key_pem:
                    existing.key.publicKeyPem,
                  fingerprint_sha256:
                    existing.key.fingerprintSha256,
                  valid_from:
                    existing.key.validFrom,
                  valid_until:
                    existing.key.validUntil ??
                      null,
                }]
              : [],
          };
        }

        if (
          options?.failPublisherInsert &&
          text.includes(
            'INSERT INTO plugin_publishers',
          )
        ) {
          throw new Error(
            'simulated insert failure',
          );
        }

        return {
          rows: [],
        };
      },
    ),
    release: jest.fn(),
  };

  const pool = {
    connect:
      jest.fn(async () => client),
  };

  return {
    executor:
      new PluginTrustBootstrapExecutor(
        pool as unknown as Pool,
      ),
    pool,
    client,
    calls,
  };
}

function queryTexts(
  calls: Array<{ text: string }>,
): string[] {
  return calls.map(
    (call) =>
      call.text.replace(/\s+/g, ' ').trim(),
  );
}

describe('PropertyOS trust bootstrap executor', () => {
  it('registers publisher and key atomically with audit events', async () => {
    const desired = input();
    const test = harness();

    const result =
      await test.executor.execute(
        desired,
        authorization(desired),
      );

    expect(result.status).toBe('EXECUTED');
    expect(result.actions).toEqual([
      'REGISTER_PUBLISHER',
      'REGISTER_KEY',
    ]);

    const texts = queryTexts(test.calls);

    expect(texts).toContain('BEGIN');
    expect(texts).toContain('COMMIT');
    expect(
      texts.some((text) =>
        text.includes(
          'pg_advisory_xact_lock',
        ),
      ),
    ).toBe(true);
    expect(
      texts.some((text) =>
        text.includes(
          'PUBLISHER_REGISTERED',
        ),
      ),
    ).toBe(true);
    expect(
      texts.some((text) =>
        text.includes('KEY_REGISTERED'),
      ),
    ).toBe(true);
    expect(texts).not.toContain('ROLLBACK');
    expect(test.client.release)
      .toHaveBeenCalledTimes(1);
  });

  it('returns an idempotent no-op for matching state', async () => {
    const desired = input();
    const test = harness({
      existing: matchingState(desired),
    });

    const result =
      await test.executor.execute(
        desired,
        authorization(desired),
      );

    expect(result.status).toBe('NOOP');
    expect(result.actions).toEqual([
      'NOOP_PUBLISHER',
      'NOOP_KEY',
    ]);

    const texts = queryTexts(test.calls);

    expect(
      texts.some((text) =>
        text.startsWith('INSERT'),
      ),
    ).toBe(false);
    expect(texts).toContain('COMMIT');
  });

  it('requires actor and approver separation before connecting', async () => {
    const desired = input();
    const approval =
      authorization(desired);
    approval.approvedBy =
      desired.actorId;

    const test = harness();

    await expect(
      test.executor.execute(
        desired,
        approval,
      ),
    ).rejects.toThrow(
      'PLUGIN_TRUST_BOOTSTRAP_APPROVER_SEPARATION_REQUIRED',
    );

    expect(test.pool.connect)
      .not.toHaveBeenCalled();
  });

  it('requires the exact approved evidence digest', async () => {
    const desired = input();
    const approval =
      authorization(desired);
    approval.expectedEvidenceSha256 =
      '0'.repeat(64);

    const test = harness();

    await expect(
      test.executor.execute(
        desired,
        approval,
      ),
    ).rejects.toThrow(
      'PLUGIN_TRUST_BOOTSTRAP_EVIDENCE_MISMATCH',
    );

    expect(test.pool.connect)
      .not.toHaveBeenCalled();
  });

  it('rolls back and releases on execution failure', async () => {
    const desired = input();
    const test = harness({
      failPublisherInsert: true,
    });

    await expect(
      test.executor.execute(
        desired,
        authorization(desired),
      ),
    ).rejects.toThrow(
      'simulated insert failure',
    );

    const texts = queryTexts(test.calls);

    expect(texts).toContain('ROLLBACK');
    expect(texts).not.toContain('COMMIT');
    expect(test.client.release)
      .toHaveBeenCalledTimes(1);
  });

  it('blocks conflicting state and rolls back', async () => {
    const desired = input();
    const state =
      matchingState(desired);

    if (!state.publisher) {
      throw new Error(
        'Expected publisher state',
      );
    }

    state.publisher.status =
      'REVOKED';

    const test = harness({
      existing: state,
    });

    await expect(
      test.executor.execute(
        desired,
        authorization(desired),
      ),
    ).rejects.toThrow(
      'Existing canonical publisher state conflicts with bootstrap',
    );

    const texts = queryTexts(test.calls);

    expect(texts).toContain('ROLLBACK');
    expect(texts).not.toContain('COMMIT');
  });
});
