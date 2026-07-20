export type RuntimeContainmentAction =
  | 'NO_RUNTIME_ACTION'
  | 'KEEP_RUNNING_DISTRIBUTION_BLOCKED'
  | 'BLOCK_NEXT_ACTIVATION_PENDING_REVIEW'
  | 'DEACTIVATE_AFTER_EXPLICIT_APPROVAL'
  | 'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL';

export interface RuntimeContainmentAssessmentInput {
  pluginId: string;
  installed: boolean;
  active: boolean;
  installationProvenanceMatches: boolean;
  publicationStatus:
    | 'APPROVED'
    | 'QUARANTINED'
    | 'REVOKED';
  publisherStatus:
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'REVOKED';
  signingKeyStatus:
    | 'ACTIVE'
    | 'REVOKED';
  artifactIntegrity:
    | 'VALID'
    | 'UNKNOWN'
    | 'MISMATCH';
  runtimeExploitEvidence:
    | 'NONE'
    | 'SUSPECTED'
    | 'CONFIRMED';
  operationalCriticality:
    | 'STANDARD'
    | 'CRITICAL';
  automaticContainmentRequested: boolean;
}

export interface RuntimeContainmentAssessment {
  status: 'ASSESSED' | 'BLOCKED';
  scope:
    'PHASE_13E_RUNTIME_CONTAINMENT_POLICY';
  pluginId: string;
  distributionAllowed: boolean;
  activationAllowed: boolean;
  containmentRecommended: boolean;
  emergencyReviewRequired: boolean;
  humanApprovalRequired: true;
  automaticContainmentAllowed: false;
  runtimeAction: RuntimeContainmentAction;
  runtimeChanged: false;
  deactivationPerformed: false;
  isolationPerformed: false;
  reasons: string[];
  errors: string[];
}

const PLUGIN_ID_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

export function assessRuntimeContainment(
  input: RuntimeContainmentAssessmentInput,
): RuntimeContainmentAssessment {
  const errors: string[] = [];
  const reasons: string[] = [];

  if (!PLUGIN_ID_PATTERN.test(input.pluginId)) {
    errors.push(
      'Runtime containment plugin identifier is invalid',
    );
  }

  if (input.active && !input.installed) {
    errors.push(
      'An active runtime must be installed',
    );
  }

  if (input.automaticContainmentRequested) {
    errors.push(
      'Automatic runtime containment is not authorized',
    );
  }

  const distributionAllowed =
    input.publicationStatus === 'APPROVED' &&
    input.publisherStatus === 'ACTIVE' &&
    input.signingKeyStatus === 'ACTIVE' &&
    input.artifactIntegrity === 'VALID';

  const activationAllowed =
    distributionAllowed &&
    input.installationProvenanceMatches &&
    input.runtimeExploitEvidence === 'NONE';

  let runtimeAction:
    RuntimeContainmentAction =
      'NO_RUNTIME_ACTION';
  let containmentRecommended = false;
  let emergencyReviewRequired = false;

  if (!input.installed) {
    if (!distributionAllowed) {
      reasons.push(
        'Distribution or trust state blocks installation',
      );
    }
  } else if (
    input.artifactIntegrity === 'MISMATCH' ||
    input.runtimeExploitEvidence === 'CONFIRMED'
  ) {
    containmentRecommended = true;
    emergencyReviewRequired = true;
    runtimeAction =
      'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL';

    if (input.artifactIntegrity === 'MISMATCH') {
      reasons.push(
        'Installed artifact integrity mismatch confirmed',
      );
    }

    if (
      input.runtimeExploitEvidence === 'CONFIRMED'
    ) {
      reasons.push(
        'Runtime exploit evidence confirmed',
      );
    }
  } else if (
    !input.installationProvenanceMatches ||
    input.artifactIntegrity === 'UNKNOWN' ||
    input.runtimeExploitEvidence === 'SUSPECTED'
  ) {
    runtimeAction =
      'BLOCK_NEXT_ACTIVATION_PENDING_REVIEW';

    if (!input.installationProvenanceMatches) {
      reasons.push(
        'Installed runtime provenance does not match',
      );
    }

    if (input.artifactIntegrity === 'UNKNOWN') {
      reasons.push(
        'Installed artifact integrity is unknown',
      );
    }

    if (
      input.runtimeExploitEvidence === 'SUSPECTED'
    ) {
      reasons.push(
        'Runtime exploit evidence requires investigation',
      );
    }
  } else if (!distributionAllowed) {
    runtimeAction =
      'KEEP_RUNNING_DISTRIBUTION_BLOCKED';

    reasons.push(
      'Distribution or trust state is no longer active',
    );
    reasons.push(
      'Distribution revocation does not automatically terminate runtime',
    );
  }

  if (
    containmentRecommended &&
    input.operationalCriticality === 'CRITICAL'
  ) {
    reasons.push(
      'Critical operational dependency requires coordinated containment',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'ASSESSED'
        : 'BLOCKED',
    scope:
      'PHASE_13E_RUNTIME_CONTAINMENT_POLICY',
    pluginId: input.pluginId,
    distributionAllowed,
    activationAllowed,
    containmentRecommended,
    emergencyReviewRequired,
    humanApprovalRequired: true,
    automaticContainmentAllowed: false,
    runtimeAction,
    runtimeChanged: false,
    deactivationPerformed: false,
    isolationPerformed: false,
    reasons,
    errors,
  };
}
