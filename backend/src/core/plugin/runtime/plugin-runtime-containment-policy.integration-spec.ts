import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  assessRuntimeContainment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

function validInput():
  RuntimeContainmentAssessmentInput {
  return {
    pluginId: 'propertyos.visitor',
    installed: true,
    active: true,
    installationProvenanceMatches: true,
    publicationStatus: 'APPROVED',
    publisherStatus: 'ACTIVE',
    signingKeyStatus: 'ACTIVE',
    artifactIntegrity: 'VALID',
    runtimeExploitEvidence: 'NONE',
    operationalCriticality: 'STANDARD',
    automaticContainmentRequested: false,
  };
}

describe(
  'Phase 13E runtime containment policy',
  () => {
    it('allows a trusted healthy runtime', () => {
      const result =
        assessRuntimeContainment(validInput());

      expect(result.status).toBe('ASSESSED');
      expect(result.distributionAllowed).toBe(true);
      expect(result.activationAllowed).toBe(true);
      expect(result.runtimeAction).toBe(
        'NO_RUNTIME_ACTION',
      );
      expect(result.runtimeChanged).toBe(false);
    });

    it('preserves runtime after distribution revocation', () => {
      const input = validInput();
      input.publicationStatus = 'REVOKED';

      const result =
        assessRuntimeContainment(input);

      expect(result.distributionAllowed).toBe(false);
      expect(result.activationAllowed).toBe(false);
      expect(result.runtimeAction).toBe(
        'KEEP_RUNNING_DISTRIBUTION_BLOCKED',
      );
      expect(result.containmentRecommended)
        .toBe(false);
      expect(result.deactivationPerformed)
        .toBe(false);
    });

    it('preserves runtime after quarantine alone', () => {
      const input = validInput();
      input.publicationStatus = 'QUARANTINED';

      const result =
        assessRuntimeContainment(input);

      expect(result.runtimeAction).toBe(
        'KEEP_RUNNING_DISTRIBUTION_BLOCKED',
      );
      expect(result.runtimeChanged).toBe(false);
    });

    it('preserves runtime after publisher suspension alone', () => {
      const input = validInput();
      input.publisherStatus = 'SUSPENDED';

      const result =
        assessRuntimeContainment(input);

      expect(result.runtimeAction).toBe(
        'KEEP_RUNNING_DISTRIBUTION_BLOCKED',
      );
      expect(result.deactivationPerformed)
        .toBe(false);
    });

    it('requires review for provenance mismatch', () => {
      const input = validInput();
      input.installationProvenanceMatches =
        false;

      const result =
        assessRuntimeContainment(input);

      expect(result.runtimeAction).toBe(
        'BLOCK_NEXT_ACTIVATION_PENDING_REVIEW',
      );
      expect(result.activationAllowed).toBe(false);
      expect(result.runtimeChanged).toBe(false);
    });

    it('requires review for unknown artifact integrity', () => {
      const input = validInput();
      input.artifactIntegrity = 'UNKNOWN';

      const result =
        assessRuntimeContainment(input);

      expect(result.runtimeAction).toBe(
        'BLOCK_NEXT_ACTIVATION_PENDING_REVIEW',
      );
    });

    it('requires review for suspected exploit evidence', () => {
      const input = validInput();
      input.runtimeExploitEvidence = 'SUSPECTED';

      const result =
        assessRuntimeContainment(input);

      expect(result.runtimeAction).toBe(
        'BLOCK_NEXT_ACTIVATION_PENDING_REVIEW',
      );
      expect(result.emergencyReviewRequired)
        .toBe(false);
    });

    it('recommends approved containment for artifact mismatch', () => {
      const input = validInput();
      input.artifactIntegrity = 'MISMATCH';

      const result =
        assessRuntimeContainment(input);

      expect(result.containmentRecommended)
        .toBe(true);
      expect(result.emergencyReviewRequired)
        .toBe(true);
      expect(result.runtimeAction).toBe(
        'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL',
      );
      expect(result.automaticContainmentAllowed)
        .toBe(false);
      expect(result.runtimeChanged).toBe(false);
    });

    it('recommends approved containment for confirmed exploit', () => {
      const input = validInput();
      input.runtimeExploitEvidence = 'CONFIRMED';

      const result =
        assessRuntimeContainment(input);

      expect(result.containmentRecommended)
        .toBe(true);
      expect(result.humanApprovalRequired).toBe(true);
      expect(result.deactivationPerformed)
        .toBe(false);
      expect(result.isolationPerformed).toBe(false);
    });

    it('coordinates containment for a critical plugin', () => {
      const input = validInput();
      input.runtimeExploitEvidence = 'CONFIRMED';
      input.operationalCriticality = 'CRITICAL';

      const result =
        assessRuntimeContainment(input);

      expect(result.reasons).toContain(
        'Critical operational dependency requires coordinated containment',
      );
    });

    it('blocks automatic containment requests', () => {
      const input = validInput();
      input.runtimeExploitEvidence = 'CONFIRMED';
      input.automaticContainmentRequested = true;

      const result =
        assessRuntimeContainment(input);

      expect(result.status).toBe('BLOCKED');
      expect(result.errors).toContain(
        'Automatic runtime containment is not authorized',
      );
      expect(result.runtimeChanged).toBe(false);
    });

    it('blocks impossible active-uninstalled state', () => {
      const input = validInput();
      input.installed = false;

      const result =
        assessRuntimeContainment(input);

      expect(result.status).toBe('BLOCKED');
      expect(result.errors).toContain(
        'An active runtime must be installed',
      );
    });

    it('blocks installation when distribution is revoked', () => {
      const input = validInput();
      input.installed = false;
      input.active = false;
      input.publicationStatus = 'REVOKED';

      const result =
        assessRuntimeContainment(input);

      expect(result.status).toBe('ASSESSED');
      expect(result.distributionAllowed).toBe(false);
      expect(result.activationAllowed).toBe(false);
      expect(result.runtimeAction).toBe(
        'NO_RUNTIME_ACTION',
      );
    });
  },
);
