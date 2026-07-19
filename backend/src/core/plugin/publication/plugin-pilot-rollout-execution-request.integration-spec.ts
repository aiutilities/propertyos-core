import {
  createHash,
  generateKeyPairSync,
} from 'crypto';
import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildTrustBootstrapPlan,
} from '../trust/plugin-trust-bootstrap-plan';
import {
  buildPluginPilotExecutionReadiness,
  PluginPilotExecutionRequest,
} from './plugin-pilot-rollout-execution-request';
import {
  buildPluginPilotRolloutPlan,
} from './plugin-pilot-rollout-plan';

function request():
  PluginPilotExecutionRequest {
  const bundleBytes =
    Buffer.from(
      'deterministic-phase-13d4-pilot-bundle',
    );
  const artifactSha256 =
    createHash('sha256')
      .update(bundleBytes)
      .digest('hex');
  const {
    publicKey,
  } = generateKeyPairSync(
    'rsa',
    {
      modulusLength: 2048,
    },
  );
  const publicKeyPem =
    publicKey.export({
      type: 'spki',
      format: 'pem',
    }).toString();

  const trustBootstrapInput = {
    environmentId:
      'phase-13d4-isolated',
    keyId:
      'pilot-key-2026',
    actorId:
      'trust-bootstrap-operator',
    validFrom:
      '2026-07-19T18:20:00.000Z',
    evidenceTimestamp:
      '2026-07-19T18:21:00.000Z',
  };
  const trustPlan =
    buildTrustBootstrapPlan({
      ...trustBootstrapInput,
      publicKeyPem,
    });

  if (
    !trustPlan.key ||
    !trustPlan.evidenceSha256
  ) {
    throw new Error(
      'Expected ready trust plan',
    );
  }

  const desired = {
    environmentClass:
      'ISOLATED' as const,
    environmentId:
      'phase-13d4-isolated',
    pluginId:
      'propertyos.phase13d4-pilot',
    pluginName:
      'PropertyOS Phase 13D4 Pilot',
    version: '1.0.0',
    publisherId:
      'propertyos' as const,
    keyId:
      'pilot-key-2026',
    keyFingerprintSha256:
      trustPlan.key
        .fingerprintSha256,
    artifactSha256,
    integritySha256:
      'b'.repeat(64),
    submitterId:
      'pilot-submitter',
    approverId:
      'pilot-approver',
    installerId:
      'pilot-installer',
    securityOperatorId:
      'pilot-security-operator',
    evidenceTimestamp:
      '2026-07-19T18:30:00.000Z',
    expectedUnrelatedPluginCount:
      1,
    runtimeContainmentEnabled:
      false as const,
  };
  const pilotPlan =
    buildPluginPilotRolloutPlan(
      desired,
    );

  if (!pilotPlan.evidenceSha256) {
    throw new Error(
      'Expected ready pilot plan',
    );
  }

  return {
    gitCommit:
      'a'.repeat(40),
    repositoryRoot:
      '/workspace/propertyos-core',
    environmentClass:
      'ISOLATED',
    environmentId:
      'phase-13d4-isolated',
    expectedDatabaseName:
      'propertyos_phase_13d4_pilot',
    forbiddenDatabaseNames: [
      'propertyos',
    ],
    bundlePath:
      '/tmp/propertyos-phase-13d4/pilot.zip',
    publicKeyPath:
      '/tmp/propertyos-phase-13d4/public.pem',
    signatureEvidencePath:
      '/tmp/propertyos-phase-13d4/signature-evidence.json',
    bundleBytes,
    publicKeyPem,
    trustBootstrapInput,
    trustBootstrapAuthorization: {
      approvalId:
        'trust-approval-001',
      approvedBy:
        'trust-approver',
      approvedAt:
        '2026-07-19T18:22:00.000Z',
      expectedEvidenceSha256:
        trustPlan.evidenceSha256,
      environmentClass:
        'ISOLATED',
      backupEvidenceId:
        'phase-13d3-backup',
      schemaAcceptanceEvidenceId:
        'phase-13d3-schema',
      fingerprintConfirmed:
        true,
      privateKeyOfflineAttested:
        true,
    },
    desired,
    pilotAuthorization: {
      approvalId:
        'pilot-approval-001',
      environmentClass:
        'ISOLATED',
      environmentId:
        'phase-13d4-isolated',
      approvedBy:
        'deployment-approver',
      operatorId:
        'pilot-security-operator',
      approvedAt:
        '2026-07-19T18:32:00.000Z',
      approvedEvidenceSha256:
        pilotPlan.evidenceSha256,
      executionAuthorized:
        true,
      runtimeContainmentEnabled:
        false,
    },
    explicitExecutionAuthorized:
      true,
  };
}

describe(
  'Phase 13D isolated pilot execution readiness',
  () => {
    it(
      'accepts a fully bound isolated request without connecting',
      () => {
        const report =
          buildPluginPilotExecutionReadiness(
            request(),
          );

        expect(report).toMatchObject({
          status: 'READY',
          databaseConnected: false,
          databaseMutated: false,
          productionAllowed: false,
          expectedDatabaseName:
            'propertyos_phase_13d4_pilot',
          errors: [],
        });

        expect(
          report.requestEvidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'blocks bundle content drift',
      () => {
        const value = request();
        value.bundleBytes =
          Buffer.from('altered');

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Pilot bundle artifact digest does not match desired state',
        );
      },
    );

    it(
      'blocks the source database',
      () => {
        const value = request();
        value.expectedDatabaseName =
          'propertyos';

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Pilot execution database boundary is invalid',
        );
      },
    );

    it(
      'blocks repository-resident execution inputs',
      () => {
        const value = request();
        value.bundlePath =
          '/workspace/propertyos-core/pilot.zip';

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Pilot bundle path must be absolute and outside the repository',
        );
      },
    );

    it(
      'blocks altered trust approval evidence',
      () => {
        const value = request();
        value
          .trustBootstrapAuthorization
          .expectedEvidenceSha256 =
            'f'.repeat(64);

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Pilot trust bootstrap evidence is not approved',
        );
      },
    );

    it(
      'blocks environment binding drift',
      () => {
        const value = request();
        value.pilotAuthorization
          .environmentId =
            'different-isolated';

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Pilot execution environment bindings do not match',
        );
      },
    );

    it(
      'blocks missing explicit authorization through an unsafe cast',
      () => {
        const value = request();

        (
          value as unknown as {
            explicitExecutionAuthorized:
              boolean;
          }
        ).explicitExecutionAuthorized =
          false;

        const report =
          buildPluginPilotExecutionReadiness(
            value,
          );

        expect(report.status)
          .toBe('BLOCKED');
        expect(report.errors).toContain(
          'Explicit pilot execution authorization is required',
        );
      },
    );
  },
);
