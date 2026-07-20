import {
  createHash,
} from 'node:crypto';

export const PHASE_14D5_ACCEPTANCE_PROOF_SHA256 =
  'dc7833b8685e17df14e3b98478f0a75cd579111093494c02a4c0969afaf8e2bb';

export type WhatsAppPilotOperationalPhase =
  | 'PRE_DELIVERY'
  | 'PROVIDER_REQUEST_STARTED'
  | 'PROVIDER_CONFIRMED'
  | 'COMPLETION_RECORDED';

export type WhatsAppPilotOperationalAction =
  | 'PROCEED_WITH_SINGLE_DELIVERY'
  | 'ABORT_WITHOUT_DELIVERY'
  | 'RECONCILE_BEFORE_ANY_RETRY'
  | 'CLOSE_EXPOSURE_AS_COMPLETED';

export interface WhatsAppPilotOperationalSnapshot {
  phase: WhatsAppPilotOperationalPhase;
  authorizationValid: boolean;
  executionRequestValid: boolean;
  exposureDecisionValid: boolean;
  invocationEvidenceValid: boolean;
  providerConfigurationUnchanged:
    boolean;
  endpointReachabilityCurrent:
    boolean;
  recipientConsentCurrent: boolean;
  operatorAndApproverSeparated:
    boolean;
  atomicReservationHeld: boolean;
  providerConfirmationReceived:
    boolean;
  completionPersistenceRecorded:
    boolean;
  deliveryAttempts: number;
  deliveryCount: number;
}

export interface WhatsAppPilotOperationalDecision {
  status: 'READY' | 'HALT';
  scope:
    'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION';
  action:
    WhatsAppPilotOperationalAction;
  deliveryMayStart: boolean;
  automaticRetryAllowed: false;
  reconciliationRequired: boolean;
  exposureMustClose: boolean;
  errors: string[];
}

export interface WhatsAppPilotReadinessRequest {
  schemaVersion: 1;
  candidateGitCommit: string;
  phase14d5AcceptanceProofSha256:
    string;
  readinessReviewId: string;
  reviewedAt: string;
  reviewedBy: string;
  executionOperatorId: string;
  reconciliationOwnerId: string;
  incidentChannelId: string;
  observationWindowMinutes: number;
  operatorRunbookAcknowledged:
    boolean;
  approverRunbookAcknowledged:
    boolean;
  reconciliationRunbookAcknowledged:
    boolean;
  explicitLiveAuthorizationPresent:
    false;
  executorExposed: false;
  executorInvocationAuthorized: false;
  liveMessageSent: false;
  databaseMutated: false;
}

export interface WhatsAppPilotReadinessDecision {
  status:
    | 'READY_FOR_EXPLICIT_LIVE_AUTHORIZATION'
    | 'BLOCKED';
  scope:
    'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_READINESS';
  readinessValid: boolean;
  readinessEvidenceSha256:
    string | null;
  candidateGitCommit: string;
  phase14d5AcceptanceProofSha256:
    string;
  observationWindowMinutes: number;
  executorExposed: false;
  executorInvocationAuthorized: false;
  liveMessageSent: false;
  databaseMutated: false;
  errors: string[];
}

const COMMIT_PATTERN =
  /^[a-f0-9]{40}$/;

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function sha256(
  value: string,
): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function validTimestamp(
  value: string,
): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function decideWhatsAppPilotOperationalAction(
  snapshot:
    WhatsAppPilotOperationalSnapshot,
): WhatsAppPilotOperationalDecision {
  const errors: string[] = [];

  if (
    !Number.isInteger(
      snapshot.deliveryAttempts,
    ) ||
    snapshot.deliveryAttempts < 0 ||
    snapshot.deliveryAttempts > 1
  ) {
    errors.push(
      'WhatsApp pilot delivery attempts must be zero or one',
    );
  }

  if (
    !Number.isInteger(
      snapshot.deliveryCount,
    ) ||
    snapshot.deliveryCount < 0 ||
    snapshot.deliveryCount > 1
  ) {
    errors.push(
      'WhatsApp pilot delivery count must be zero or one',
    );
  }

  const preconditionsValid =
    snapshot.authorizationValid &&
    snapshot.executionRequestValid &&
    snapshot.exposureDecisionValid &&
    snapshot.invocationEvidenceValid &&
    snapshot
      .providerConfigurationUnchanged &&
    snapshot.endpointReachabilityCurrent &&
    snapshot.recipientConsentCurrent &&
    snapshot
      .operatorAndApproverSeparated &&
    snapshot.atomicReservationHeld;

  if (
    snapshot.phase ===
      'PRE_DELIVERY' &&
    errors.length === 0 &&
    preconditionsValid &&
    snapshot.deliveryAttempts === 0 &&
    snapshot.deliveryCount === 0 &&
    !snapshot
      .providerConfirmationReceived &&
    !snapshot
      .completionPersistenceRecorded
  ) {
    return {
      status: 'READY',
      scope:
        'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
      action:
        'PROCEED_WITH_SINGLE_DELIVERY',
      deliveryMayStart: true,
      automaticRetryAllowed: false,
      reconciliationRequired: false,
      exposureMustClose: false,
      errors: [],
    };
  }

  if (
    snapshot.phase ===
      'PRE_DELIVERY'
  ) {
    if (!preconditionsValid) {
      errors.push(
        'WhatsApp pilot pre-delivery conditions are not valid',
      );
    }

    return {
      status: 'HALT',
      scope:
        'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
      action:
        'ABORT_WITHOUT_DELIVERY',
      deliveryMayStart: false,
      automaticRetryAllowed: false,
      reconciliationRequired: false,
      exposureMustClose: true,
      errors,
    };
  }

  if (
    snapshot.phase ===
      'PROVIDER_CONFIRMED' &&
    snapshot
      .providerConfirmationReceived &&
    !snapshot
      .completionPersistenceRecorded
  ) {
    return {
      status: 'HALT',
      scope:
        'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
      action:
        'RECONCILE_BEFORE_ANY_RETRY',
      deliveryMayStart: false,
      automaticRetryAllowed: false,
      reconciliationRequired: true,
      exposureMustClose: false,
      errors: [
        ...errors,
        'Provider confirmation exists without durable completion evidence',
      ],
    };
  }

  if (
    snapshot.phase ===
      'COMPLETION_RECORDED' &&
    snapshot
      .providerConfirmationReceived &&
    snapshot
      .completionPersistenceRecorded &&
    snapshot.deliveryAttempts === 1 &&
    snapshot.deliveryCount === 1
  ) {
    return {
      status: 'READY',
      scope:
        'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
      action:
        'CLOSE_EXPOSURE_AS_COMPLETED',
      deliveryMayStart: false,
      automaticRetryAllowed: false,
      reconciliationRequired: false,
      exposureMustClose: true,
      errors: [],
    };
  }

  return {
    status: 'HALT',
    scope:
      'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
    action:
      'RECONCILE_BEFORE_ANY_RETRY',
    deliveryMayStart: false,
    automaticRetryAllowed: false,
    reconciliationRequired: true,
    exposureMustClose: false,
    errors: [
      ...errors,
      'WhatsApp pilot delivery state is incomplete or ambiguous',
    ],
  };
}

export function evaluateWhatsAppPilotOperationalReadiness(
  request:
    WhatsAppPilotReadinessRequest,
): WhatsAppPilotReadinessDecision {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported WhatsApp pilot readiness schema version',
    );
  }

  if (
    !COMMIT_PATTERN.test(
      request.candidateGitCommit,
    )
  ) {
    errors.push(
      'WhatsApp pilot readiness candidate commit is invalid',
    );
  }

  if (
    request.phase14d5AcceptanceProofSha256 !==
    PHASE_14D5_ACCEPTANCE_PROOF_SHA256
  ) {
    errors.push(
      'Phase 14D5 isolated acceptance proof does not match',
    );
  }

  for (const identifier of [
    request.readinessReviewId,
    request.reviewedBy,
    request.executionOperatorId,
    request.reconciliationOwnerId,
    request.incidentChannelId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'WhatsApp pilot readiness identifier is invalid',
      );
      break;
    }
  }

  if (!validTimestamp(request.reviewedAt)) {
    errors.push(
      'WhatsApp pilot readiness review timestamp is invalid',
    );
  }

  if (
    request.reviewedBy ===
    request.executionOperatorId
  ) {
    errors.push(
      'WhatsApp pilot readiness reviewer and execution operator must be different',
    );
  }

  if (
    request.reconciliationOwnerId ===
    request.executionOperatorId
  ) {
    errors.push(
      'WhatsApp pilot reconciliation owner must be independent from the execution operator',
    );
  }

  if (
    !Number.isInteger(
      request.observationWindowMinutes,
    ) ||
    request.observationWindowMinutes < 30 ||
    request.observationWindowMinutes > 240
  ) {
    errors.push(
      'WhatsApp pilot observation window must be between 30 and 240 minutes',
    );
  }

  if (
    !request
      .operatorRunbookAcknowledged ||
    !request
      .approverRunbookAcknowledged ||
    !request
      .reconciliationRunbookAcknowledged
  ) {
    errors.push(
      'All WhatsApp pilot operational roles must acknowledge the runbook',
    );
  }

  if (
    request
      .explicitLiveAuthorizationPresent !==
      false
  ) {
    errors.push(
      'Readiness closure must not contain live-delivery authorization',
    );
  }

  if (
    request.executorExposed !== false ||
    request
      .executorInvocationAuthorized !==
      false ||
    request.liveMessageSent !== false
  ) {
    errors.push(
      'Readiness closure must represent a non-executed and unexposed state',
    );
  }

  if (request.databaseMutated !== false) {
    errors.push(
      'Readiness closure must not mutate the database',
    );
  }

  const readinessValid =
    errors.length === 0;

  const readinessEvidenceSha256 =
    readinessValid
      ? sha256(
          JSON.stringify({
            candidateGitCommit:
              request.candidateGitCommit,
            executionOperatorId:
              request.executionOperatorId,
            incidentChannelId:
              request.incidentChannelId,
            observationWindowMinutes:
              request
                .observationWindowMinutes,
            phase14d5AcceptanceProofSha256:
              request
                .phase14d5AcceptanceProofSha256,
            readinessReviewId:
              request.readinessReviewId,
            reconciliationOwnerId:
              request
                .reconciliationOwnerId,
            reviewedAt:
              request.reviewedAt,
            reviewedBy:
              request.reviewedBy,
          }),
        )
      : null;

  return {
    status: readinessValid
      ? 'READY_FOR_EXPLICIT_LIVE_AUTHORIZATION'
      : 'BLOCKED',
    scope:
      'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_READINESS',
    readinessValid,
    readinessEvidenceSha256,
    candidateGitCommit:
      request.candidateGitCommit,
    phase14d5AcceptanceProofSha256:
      request
        .phase14d5AcceptanceProofSha256,
    observationWindowMinutes:
      request.observationWindowMinutes,
    executorExposed: false,
    executorInvocationAuthorized: false,
    liveMessageSent: false,
    databaseMutated: false,
    errors,
  };
}
