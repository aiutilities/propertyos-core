import {
  createHash,
} from 'crypto';
import {
  isAbsolute,
  relative,
  resolve,
} from 'path';
import {
  TrustBootstrapAuthorization,
} from '../trust/plugin-trust-bootstrap-executor';
import {
  buildTrustBootstrapPlan,
  TrustBootstrapInput,
} from '../trust/plugin-trust-bootstrap-plan';
import {
  PilotRolloutAuthorization,
} from './plugin-pilot-rollout-executor';
import {
  buildPluginPilotRolloutPlan,
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

const GIT_COMMIT_PATTERN =
  /^[a-f0-9]{40}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;
const PRIVATE_KEY_PATTERN =
  /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/;

export interface PluginPilotExecutionRequest {
  gitCommit: string;
  repositoryRoot: string;
  environmentClass:
    'ISOLATED' | 'STAGING';
  environmentId: string;
  expectedDatabaseName: string;
  forbiddenDatabaseNames:
    string[];
  bundlePath: string;
  publicKeyPath: string;
  signatureEvidencePath: string;
  bundleBytes: Buffer;
  publicKeyPem: string;
  trustBootstrapInput:
    Omit<
      TrustBootstrapInput,
      'publicKeyPem'
    >;
  trustBootstrapAuthorization:
    TrustBootstrapAuthorization;
  desired:
    PluginPilotRolloutInput;
  pilotAuthorization:
    PilotRolloutAuthorization;
  explicitExecutionAuthorized:
    true;
}

export interface PluginPilotExecutionReadiness {
  status: 'READY' | 'BLOCKED';
  scope:
    'PHASE_13D_ISOLATED_PILOT_EXECUTION';
  databaseConnected: false;
  databaseMutated: false;
  productionAllowed: false;
  gitCommit: string;
  environmentId: string;
  expectedDatabaseName: string;
  artifactSha256: string;
  trustEvidenceSha256:
    string | null;
  pilotEvidenceSha256:
    string | null;
  requestEvidenceSha256:
    string | null;
  errors: string[];
}

export function buildPluginPilotExecutionReadiness(
  request: PluginPilotExecutionRequest,
): PluginPilotExecutionReadiness {
  const errors: string[] = [];
  const repositoryRoot =
    resolve(request.repositoryRoot);
  const artifactSha256 =
    createHash('sha256')
      .update(request.bundleBytes)
      .digest('hex');

  if (
    !GIT_COMMIT_PATTERN.test(
      request.gitCommit,
    )
  ) {
    errors.push(
      'Pilot execution Git commit is invalid',
    );
  }

  if (
    request.environmentClass !==
      'ISOLATED' &&
    request.environmentClass !==
      'STAGING'
  ) {
    errors.push(
      'Production pilot execution is forbidden',
    );
  }

  if (
    !request.environmentId.trim() ||
    request.expectedDatabaseName ===
      'propertyos' ||
    !request
      .expectedDatabaseName
      .trim() ||
    request.forbiddenDatabaseNames
      .includes(
        request.expectedDatabaseName,
      ) ||
    !request.forbiddenDatabaseNames
      .includes('propertyos')
  ) {
    errors.push(
      'Pilot execution database boundary is invalid',
    );
  }

  for (
    const [label, candidate]
    of [
      [
        'bundle',
        request.bundlePath,
      ],
      [
        'public key',
        request.publicKeyPath,
      ],
      [
        'signature evidence',
        request.signatureEvidencePath,
      ],
    ]
  ) {
    if (
      !candidate.trim() ||
      !isAbsolute(candidate) ||
      thisPathIsInside(
        repositoryRoot,
        resolve(candidate),
      )
    ) {
      errors.push(
        `Pilot ${label} path must be absolute and outside the repository`,
      );
    }
  }

  if (
    request.bundleBytes.length === 0 ||
    request.bundleBytes.length >
      100 * 1024 * 1024
  ) {
    errors.push(
      'Pilot bundle size is invalid',
    );
  }

  if (
    PRIVATE_KEY_PATTERN.test(
      request.publicKeyPem,
    )
  ) {
    errors.push(
      'Pilot private key material is forbidden',
    );
  }

  if (
    artifactSha256 !==
      request.desired
        .artifactSha256 ||
    !SHA256_PATTERN.test(
      artifactSha256,
    )
  ) {
    errors.push(
      'Pilot bundle artifact digest does not match desired state',
    );
  }

  const trustInput:
    TrustBootstrapInput = {
      ...request
        .trustBootstrapInput,
      publicKeyPem:
        request.publicKeyPem,
  };
  const trustPlan =
    buildTrustBootstrapPlan(
      trustInput,
    );

  if (
    trustPlan.status !== 'READY' ||
    !trustPlan.evidenceSha256 ||
    trustPlan.evidenceSha256 !==
      request
        .trustBootstrapAuthorization
        .expectedEvidenceSha256
  ) {
    errors.push(
      'Pilot trust bootstrap evidence is not approved',
    );
  }

  const pilotPlan =
    buildPluginPilotRolloutPlan(
      request.desired,
    );

  if (
    pilotPlan.status !== 'READY' ||
    !pilotPlan.evidenceSha256 ||
    pilotPlan.evidenceSha256 !==
      request
        .pilotAuthorization
        .approvedEvidenceSha256
  ) {
    errors.push(
      'Pilot rollout evidence is not approved',
    );
  }

  if (
    request.explicitExecutionAuthorized !==
      true
  ) {
    errors.push(
      'Explicit pilot execution authorization is required',
    );
  }

  if (
    request.environmentId !==
      request.desired.environmentId ||
    request.environmentClass !==
      request.desired
        .environmentClass ||
    request.environmentId !==
      request.trustBootstrapInput
        .environmentId ||
    request.environmentId !==
      request.pilotAuthorization
        .environmentId ||
    request.environmentClass !==
      request.pilotAuthorization
        .environmentClass ||
    request.environmentClass !==
      request
        .trustBootstrapAuthorization
        .environmentClass
  ) {
    errors.push(
      'Pilot execution environment bindings do not match',
    );
  }

  if (
    request.pilotAuthorization
      .runtimeContainmentEnabled ||
    request.desired
      .runtimeContainmentEnabled
  ) {
    errors.push(
      'Pilot runtime containment is forbidden',
    );
  }

  const status =
    errors.length === 0
      ? 'READY'
      : 'BLOCKED';

  const requestEvidenceSha256 =
    status === 'READY'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              artifactSha256,
              environmentClass:
                request
                  .environmentClass,
              environmentId:
                request.environmentId,
              expectedDatabaseName:
                request
                  .expectedDatabaseName,
              gitCommit:
                request.gitCommit,
              pilotApprovalId:
                request
                  .pilotAuthorization
                  .approvalId,
              pilotEvidenceSha256:
                pilotPlan
                  .evidenceSha256,
              trustApprovalId:
                request
                  .trustBootstrapAuthorization
                  .approvalId,
              trustEvidenceSha256:
                trustPlan
                  .evidenceSha256,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_13D_ISOLATED_PILOT_EXECUTION',
    databaseConnected: false,
    databaseMutated: false,
    productionAllowed: false,
    gitCommit:
      request.gitCommit,
    environmentId:
      request.environmentId,
    expectedDatabaseName:
      request.expectedDatabaseName,
    artifactSha256,
    trustEvidenceSha256:
      trustPlan.evidenceSha256,
    pilotEvidenceSha256:
      pilotPlan.evidenceSha256,
    requestEvidenceSha256,
    errors,
  };
}

function thisPathIsInside(
  parent: string,
  candidate: string,
): boolean {
  const item =
    relative(parent, candidate);

  return (
    item === '' ||
    (
      !item.startsWith('..') &&
      !isAbsolute(item)
    )
  );
}
