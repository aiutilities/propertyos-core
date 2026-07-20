import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  decideWhatsAppPilotOperationalAction,
  evaluateWhatsAppPilotOperationalReadiness,
  PHASE_14D5_ACCEPTANCE_PROOF_SHA256,
  WhatsAppPilotOperationalSnapshot,
  WhatsAppPilotReadinessRequest,
} from './whatsapp-pilot-operational-readiness';

function readinessRequest():
  WhatsAppPilotReadinessRequest {
  return {
    schemaVersion: 1,
    candidateGitCommit:
      '9721c8af39556afe7f92fca733acc11164881a9e',
    phase14d5AcceptanceProofSha256:
      PHASE_14D5_ACCEPTANCE_PROOF_SHA256,
    readinessReviewId:
      'phase-14d6-readiness-review-001',
    reviewedAt:
      '2026-07-20T07:00:00.000Z',
    reviewedBy:
      'approver.pilot',
    executionOperatorId:
      'operator.anand',
    reconciliationOwnerId:
      'operator.reconciliation',
    incidentChannelId:
      'propertyos-pilot-incident',
    observationWindowMinutes:
      60,
    operatorRunbookAcknowledged:
      true,
    approverRunbookAcknowledged:
      true,
    reconciliationRunbookAcknowledged:
      true,
    explicitLiveAuthorizationPresent:
      false,
    executorExposed: false,
    executorInvocationAuthorized:
      false,
    liveMessageSent: false,
    databaseMutated: false,
  };
}

function operationalSnapshot():
  WhatsAppPilotOperationalSnapshot {
  return {
    phase: 'PRE_DELIVERY',
    authorizationValid: true,
    executionRequestValid: true,
    exposureDecisionValid: true,
    invocationEvidenceValid: true,
    providerConfigurationUnchanged:
      true,
    endpointReachabilityCurrent:
      true,
    recipientConsentCurrent: true,
    operatorAndApproverSeparated:
      true,
    atomicReservationHeld: true,
    providerConfirmationReceived:
      false,
    completionPersistenceRecorded:
      false,
    deliveryAttempts: 0,
    deliveryCount: 0,
  };
}

describe(
  'Phase 14D6 WhatsApp pilot operational readiness',
  () => {
    it(
      'closes readiness without authorizing a live delivery',
      () => {
        const decision =
          evaluateWhatsAppPilotOperationalReadiness(
            readinessRequest(),
          );

        expect(decision).toMatchObject({
          status:
            'READY_FOR_EXPLICIT_LIVE_AUTHORIZATION',
          readinessValid: true,
          executorExposed: false,
          executorInvocationAuthorized:
            false,
          liveMessageSent: false,
          databaseMutated: false,
          errors: [],
        });

        expect(
          decision
            .readinessEvidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'binds readiness to the accepted Phase 14D5 proof',
      () => {
        const decision =
          evaluateWhatsAppPilotOperationalReadiness({
            ...readinessRequest(),
            phase14d5AcceptanceProofSha256:
              'a'.repeat(64),
          });

        expect(decision.errors).toContain(
          'Phase 14D5 isolated acceptance proof does not match',
        );
      },
    );

    it(
      'requires independent operational actors',
      () => {
        const base =
          readinessRequest();

        const sameReviewer =
          evaluateWhatsAppPilotOperationalReadiness({
            ...base,
            reviewedBy:
              base.executionOperatorId,
          });

        expect(
          sameReviewer.errors,
        ).toContain(
          'WhatsApp pilot readiness reviewer and execution operator must be different',
        );

        const sameReconciliationOwner =
          evaluateWhatsAppPilotOperationalReadiness({
            ...base,
            reconciliationOwnerId:
              base.executionOperatorId,
          });

        expect(
          sameReconciliationOwner.errors,
        ).toContain(
          'WhatsApp pilot reconciliation owner must be independent from the execution operator',
        );
      },
    );

    it.each([
      29,
      241,
      60.5,
    ])(
      'rejects invalid observation window %s',
      (observationWindowMinutes) => {
        const decision =
          evaluateWhatsAppPilotOperationalReadiness({
            ...readinessRequest(),
            observationWindowMinutes,
          });

        expect(decision.errors).toContain(
          'WhatsApp pilot observation window must be between 30 and 240 minutes',
        );
      },
    );

    it(
      'requires every operational role to acknowledge the runbook',
      () => {
        const decision =
          evaluateWhatsAppPilotOperationalReadiness({
            ...readinessRequest(),
            reconciliationRunbookAcknowledged:
              false,
          });

        expect(decision.errors).toContain(
          'All WhatsApp pilot operational roles must acknowledge the runbook',
        );
      },
    );

    it(
      'permits one delivery only when every precondition is valid',
      () => {
        expect(
          decideWhatsAppPilotOperationalAction(
            operationalSnapshot(),
          ),
        ).toEqual({
          status: 'READY',
          scope:
            'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
          action:
            'PROCEED_WITH_SINGLE_DELIVERY',
          deliveryMayStart: true,
          automaticRetryAllowed: false,
          reconciliationRequired:
            false,
          exposureMustClose: false,
          errors: [],
        });
      },
    );

    it(
      'aborts without delivery when a precondition changes',
      () => {
        const decision =
          decideWhatsAppPilotOperationalAction({
            ...operationalSnapshot(),
            recipientConsentCurrent:
              false,
          });

        expect(decision).toMatchObject({
          status: 'HALT',
          action:
            'ABORT_WITHOUT_DELIVERY',
          deliveryMayStart: false,
          automaticRetryAllowed:
            false,
          exposureMustClose: true,
        });
      },
    );

    it(
      'requires reconciliation after provider confirmation without persistence',
      () => {
        const decision =
          decideWhatsAppPilotOperationalAction({
            ...operationalSnapshot(),
            phase:
              'PROVIDER_CONFIRMED',
            providerConfirmationReceived:
              true,
            deliveryAttempts: 1,
          });

        expect(decision).toMatchObject({
          status: 'HALT',
          action:
            'RECONCILE_BEFORE_ANY_RETRY',
          deliveryMayStart: false,
          automaticRetryAllowed:
            false,
          reconciliationRequired:
            true,
          exposureMustClose: false,
        });
      },
    );

    it(
      'closes exposure after exactly one durable delivery',
      () => {
        const decision =
          decideWhatsAppPilotOperationalAction({
            ...operationalSnapshot(),
            phase:
              'COMPLETION_RECORDED',
            providerConfirmationReceived:
              true,
            completionPersistenceRecorded:
              true,
            deliveryAttempts: 1,
            deliveryCount: 1,
          });

        expect(decision).toEqual({
          status: 'READY',
          scope:
            'PHASE_14D6_WHATSAPP_PILOT_OPERATIONAL_DECISION',
          action:
            'CLOSE_EXPOSURE_AS_COMPLETED',
          deliveryMayStart: false,
          automaticRetryAllowed:
            false,
          reconciliationRequired:
            false,
          exposureMustClose: true,
          errors: [],
        });
      },
    );

    it(
      'never permits automatic retry for an ambiguous state',
      () => {
        const decision =
          decideWhatsAppPilotOperationalAction({
            ...operationalSnapshot(),
            phase:
              'PROVIDER_REQUEST_STARTED',
            deliveryAttempts: 1,
          });

        expect(decision).toMatchObject({
          status: 'HALT',
          action:
            'RECONCILE_BEFORE_ANY_RETRY',
          automaticRetryAllowed:
            false,
          reconciliationRequired:
            true,
        });
      },
    );
  },
);
