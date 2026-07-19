import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  generateKeyPairSync,
} from 'crypto';
import {
  buildTrustBootstrapPlan,
  ExistingTrustBootstrapState,
  TrustBootstrapInput,
} from './plugin-trust-bootstrap-plan';

function keyPair(): {
  publicKeyPem: string;
  privateKeyPem: string;
} {
  const {
    publicKey,
    privateKey,
  } = generateKeyPairSync(
    'rsa',
    {
      modulusLength: 2048,
    },
  );

  return {
    publicKeyPem: String(
      publicKey.export({
        type: 'spki',
        format: 'pem',
      }),
    ),
    privateKeyPem: String(
      privateKey.export({
        type: 'pkcs8',
        format: 'pem',
      }),
    ),
  };
}

function input(
  publicKeyPem: string,
): TrustBootstrapInput {
  return {
    environmentId:
      'propertyos-staging',
    keyId:
      'propertyos-release-2026-01',
    publicKeyPem,
    actorId:
      'deployment-security',
    validFrom:
      '2026-07-19T00:00:00.000Z',
    evidenceTimestamp:
      '2026-07-19T16:00:00.000Z',
  };
}

function existingState(
  plan: ReturnType<
    typeof buildTrustBootstrapPlan
  >,
): ExistingTrustBootstrapState {
  if (!plan.key) {
    throw new Error('Expected bootstrap key');
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

describe('PropertyOS trust bootstrap plan', () => {
  it('plans canonical publisher and public-key registration', () => {
    const keys = keyPair();
    const plan = buildTrustBootstrapPlan(
      input(keys.publicKeyPem),
    );

    expect(plan.status).toBe('READY');
    expect(plan.executeAuthorized).toBe(false);
    expect(plan.privateKeyAccepted).toBe(false);
    expect(plan.publisher).toEqual({
      publisherId: 'propertyos',
      displayName: 'PropertyOS',
    });
    expect(plan.actions).toEqual([
      'REGISTER_PUBLISHER',
      'REGISTER_KEY',
    ]);
    expect(plan.key?.algorithm)
      .toBe('RSA-SHA256');
    expect(plan.key?.modulusLength)
      .toBe(2048);
    expect(plan.evidenceSha256)
      .toMatch(/^[a-f0-9]{64}$/);
  });

  it('is idempotent for matching existing state', () => {
    const keys = keyPair();
    const first = buildTrustBootstrapPlan(
      input(keys.publicKeyPem),
    );

    const repeated = buildTrustBootstrapPlan(
      input(keys.publicKeyPem),
      existingState(first),
    );

    expect(repeated.status).toBe('READY');
    expect(repeated.actions).toEqual([
      'NOOP_PUBLISHER',
      'NOOP_KEY',
    ]);
    expect(repeated.evidenceSha256)
      .toBe(first.evidenceSha256);
  });

  it('is deterministic for identical desired state', () => {
    const keys = keyPair();
    const desired = input(keys.publicKeyPem);

    const first =
      buildTrustBootstrapPlan(desired);
    const second =
      buildTrustBootstrapPlan(desired);

    expect(second).toEqual(first);
  });

  it('rejects private signing material', () => {
    const keys = keyPair();
    const plan = buildTrustBootstrapPlan(
      input(keys.privateKeyPem),
    );

    expect(plan.status).toBe('BLOCKED');
    expect(plan.privateKeyAccepted).toBe(false);
    expect(plan.key).toBeNull();
    expect(plan.evidenceSha256).toBeNull();
    expect(plan.errors).toContain(
      'PLUGIN_PUBLISHER_PRIVATE_KEY_FORBIDDEN',
    );
  });

  it('blocks conflicting publisher state', () => {
    const keys = keyPair();
    const plan = buildTrustBootstrapPlan(
      input(keys.publicKeyPem),
      {
        publisher: {
          publisherId: 'propertyos',
          displayName: 'Imposter',
          status: 'ACTIVE',
        },
      },
    );

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Existing canonical publisher state conflicts with bootstrap',
    );
  });

  it('blocks conflicting registered key state', () => {
    const firstKeys = keyPair();
    const secondKeys = keyPair();
    const first = buildTrustBootstrapPlan(
      input(firstKeys.publicKeyPem),
    );

    const state = existingState(first);
    const plan = buildTrustBootstrapPlan(
      input(secondKeys.publicKeyPem),
      state,
    );

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Existing canonical key state conflicts with bootstrap',
    );
  });

  it('rejects invalid key validity windows', () => {
    const keys = keyPair();
    const desired = input(keys.publicKeyPem);
    desired.validUntil =
      '2026-07-18T00:00:00.000Z';

    const plan =
      buildTrustBootstrapPlan(desired);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Bootstrap key validUntil must follow validFrom',
    );
  });
});
