import {
  createHash,
} from 'crypto';
import {
  canonicalizePluginPublicKey,
} from './plugin-public-key-policy';

export const CANONICAL_PROPERTYOS_PUBLISHER = {
  publisherId: 'propertyos',
  displayName: 'PropertyOS',
} as const;

export interface TrustBootstrapInput {
  environmentId: string;
  keyId: string;
  publicKeyPem: string;
  actorId: string;
  validFrom: string;
  validUntil?: string;
  evidenceTimestamp: string;
}

export interface ExistingTrustBootstrapState {
  publisher?: {
    publisherId: string;
    displayName: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  };
  key?: {
    keyId: string;
    publisherId: string;
    status: 'ACTIVE' | 'REVOKED';
    algorithm: string;
    publicKeyPem: string;
    fingerprintSha256: string;
    validFrom: string;
    validUntil?: string;
  };
}

export type TrustBootstrapAction =
  | 'REGISTER_PUBLISHER'
  | 'REGISTER_KEY'
  | 'NOOP_PUBLISHER'
  | 'NOOP_KEY';

export interface TrustBootstrapPlan {
  status: 'READY' | 'BLOCKED';
  executeAuthorized: false;
  privateKeyAccepted: false;
  environmentId: string;
  actorId: string;
  publisher: {
    publisherId: 'propertyos';
    displayName: 'PropertyOS';
  };
  key: {
    keyId: string;
    algorithm: 'RSA-SHA256';
    publicKeyPem: string;
    fingerprintSha256: string;
    modulusLength: number;
    validFrom: string;
    validUntil?: string;
  } | null;
  actions: TrustBootstrapAction[];
  evidenceTimestamp: string;
  evidenceSha256: string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value))
  );
}

function canonicalEvidence(
  value: Record<string, unknown>,
): string {
  const keys = Object.keys(value).sort();
  const canonical: Record<string, unknown> = {};

  for (const key of keys) {
    canonical[key] = value[key];
  }

  return JSON.stringify(canonical);
}

export function buildTrustBootstrapPlan(
  input: TrustBootstrapInput,
  existing: ExistingTrustBootstrapState = {},
): TrustBootstrapPlan {
  const errors: string[] = [];
  const actions: TrustBootstrapAction[] = [];

  if (!input.environmentId.trim()) {
    errors.push(
      'Bootstrap environment identifier is required',
    );
  }

  if (!IDENTIFIER_PATTERN.test(input.keyId)) {
    errors.push('Bootstrap key ID is invalid');
  }

  if (!IDENTIFIER_PATTERN.test(input.actorId)) {
    errors.push('Bootstrap actor ID is invalid');
  }

  if (!validTimestamp(input.validFrom)) {
    errors.push('Bootstrap key validFrom is invalid');
  }

  if (
    input.validUntil &&
    (
      !validTimestamp(input.validUntil) ||
      Date.parse(input.validUntil) <=
        Date.parse(input.validFrom)
    )
  ) {
    errors.push(
      'Bootstrap key validUntil must follow validFrom',
    );
  }

  if (!validTimestamp(input.evidenceTimestamp)) {
    errors.push(
      'Bootstrap evidence timestamp is invalid',
    );
  }

  let canonicalKey:
    ReturnType<
      typeof canonicalizePluginPublicKey
    > | null = null;

  try {
    canonicalKey =
      canonicalizePluginPublicKey(
        input.publicKeyPem,
      );
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : 'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
    );
  }

  if (existing.publisher) {
    if (
      existing.publisher.publisherId !==
        CANONICAL_PROPERTYOS_PUBLISHER.publisherId ||
      existing.publisher.displayName !==
        CANONICAL_PROPERTYOS_PUBLISHER.displayName ||
      existing.publisher.status !== 'ACTIVE'
    ) {
      errors.push(
        'Existing canonical publisher state conflicts with bootstrap',
      );
    } else {
      actions.push('NOOP_PUBLISHER');
    }
  } else {
    actions.push('REGISTER_PUBLISHER');
  }

  if (existing.key && canonicalKey) {
    let existingCanonical:
      ReturnType<
        typeof canonicalizePluginPublicKey
      > | null = null;

    try {
      existingCanonical =
        canonicalizePluginPublicKey(
          existing.key.publicKeyPem,
        );
    } catch {
      errors.push(
        'Existing bootstrap key is not canonical',
      );
    }

    if (
      existing.key.keyId !== input.keyId ||
      existing.key.publisherId !==
        CANONICAL_PROPERTYOS_PUBLISHER.publisherId ||
      existing.key.status !== 'ACTIVE' ||
      existing.key.algorithm !== 'RSA-SHA256' ||
      existing.key.fingerprintSha256 !==
        canonicalKey.fingerprintSha256 ||
      existingCanonical?.fingerprintSha256 !==
        canonicalKey.fingerprintSha256 ||
      existing.key.validFrom !== input.validFrom ||
      existing.key.validUntil !== input.validUntil
    ) {
      errors.push(
        'Existing canonical key state conflicts with bootstrap',
      );
    } else {
      actions.push('NOOP_KEY');
    }
  } else if (!existing.key) {
    actions.push('REGISTER_KEY');
  }

  const key = canonicalKey
    ? {
        keyId: input.keyId,
        algorithm: canonicalKey.algorithm,
        publicKeyPem: canonicalKey.publicKeyPem,
        fingerprintSha256:
          canonicalKey.fingerprintSha256,
        modulusLength:
          canonicalKey.modulusLength,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
      }
    : null;

  const status =
    errors.length === 0 ? 'READY' : 'BLOCKED';

  const evidenceSha256 =
    status === 'READY' && key
      ? createHash('sha256')
          .update(
            canonicalEvidence({
              actorId: input.actorId,
              environmentId:
                input.environmentId,
              evidenceTimestamp:
                input.evidenceTimestamp,
              fingerprintSha256:
                key.fingerprintSha256,
              keyId: key.keyId,
              publisherId:
                CANONICAL_PROPERTYOS_PUBLISHER.publisherId,
              validFrom: key.validFrom,
              validUntil:
                key.validUntil ?? null,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    executeAuthorized: false,
    privateKeyAccepted: false,
    environmentId: input.environmentId,
    actorId: input.actorId,
    publisher:
      CANONICAL_PROPERTYOS_PUBLISHER,
    key,
    actions,
    evidenceTimestamp:
      input.evidenceTimestamp,
    evidenceSha256,
    errors,
  };
}
