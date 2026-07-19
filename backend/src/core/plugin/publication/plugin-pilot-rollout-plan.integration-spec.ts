import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildPluginPilotRolloutPlan,
  PILOT_ROLLOUT_STAGES,
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

function validInput():
  PluginPilotRolloutInput {
  return {
    environmentClass: 'ISOLATED',
    environmentId:
      'propertyos-pilot',
    pluginId:
      'propertyos-pilot-plugin',
    pluginName:
      'PropertyOS Pilot Plugin',
    version:
      '0.1.0',
    publisherId:
      'propertyos',
    keyId:
      'propertyos-pilot-key',
    keyFingerprintSha256:
      'a'.repeat(64),
    artifactSha256:
      'b'.repeat(64),
    integritySha256:
      'c'.repeat(64),
    submitterId:
      'pilot-submitter',
    approverId:
      'pilot-approver',
    installerId:
      'pilot-installer',
    securityOperatorId:
      'pilot-security',
    evidenceTimestamp:
      '2026-07-19T18:30:00.000Z',
    expectedUnrelatedPluginCount: 1,
    runtimeContainmentEnabled: false,
  };
}

describe('Phase 13D pilot rollout plan', () => {
  it('plans the complete controlled lifecycle', () => {
    const plan =
      buildPluginPilotRolloutPlan(
        validInput(),
      );

    expect(plan.status).toBe('READY');
    expect(plan.executionAuthorized)
      .toBe(false);
    expect(plan.productionAllowed)
      .toBe(false);
    expect(plan.publisherId)
      .toBe('propertyos');
    expect(plan.revocationBoundary)
      .toBe('DISTRIBUTION_ONLY');
    expect(plan.stages)
      .toEqual(PILOT_ROLLOUT_STAGES);
    expect(plan.evidenceSha256)
      .toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for identical desired state', () => {
    const input = validInput();

    const first =
      buildPluginPilotRolloutPlan(input);
    const second =
      buildPluginPilotRolloutPlan(input);

    expect(second).toEqual(first);
  });

  it('requires separate submitter and approver', () => {
    const input = validInput();
    input.approverId =
      input.submitterId;

    const plan =
      buildPluginPilotRolloutPlan(input);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Pilot submitter and approver must be different',
    );
  });

  it('requires canonical publisher identity', () => {
    const input = validInput();

    (
      input as {
        publisherId: string;
      }
    ).publisherId = 'untrusted';

    const plan =
      buildPluginPilotRolloutPlan(input);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Pilot publisher must be propertyos',
    );
  });

  it('rejects invalid provenance digests', () => {
    const input = validInput();
    input.artifactSha256 = 'invalid';

    const plan =
      buildPluginPilotRolloutPlan(input);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Pilot artifact SHA-256 is invalid',
    );
  });

  it('blocks automatic runtime containment', () => {
    const input = validInput();

    (
      input as {
        runtimeContainmentEnabled: boolean;
      }
    ).runtimeContainmentEnabled = true;

    const plan =
      buildPluginPilotRolloutPlan(input);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Automatic runtime containment is outside Phase 13D',
    );
  });

  it('blocks production through an unsafe cast', () => {
    const input = validInput();

    (
      input as {
        environmentClass: string;
      }
    ).environmentClass = 'PRODUCTION';

    const plan =
      buildPluginPilotRolloutPlan(input);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.productionAllowed)
      .toBe(false);
    expect(plan.errors).toContain(
      'Production pilot rollout is forbidden',
    );
  });
});
