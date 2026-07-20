import {
  createHash,
} from 'node:crypto';

import {
  buildWhatsAppPilotDeliveryAuthorization,
  WhatsAppPilotDeliveryAuthorizationPlan,
  WhatsAppPilotDeliveryAuthorizationRequest,
} from './whatsapp-pilot-delivery-authorization';

export interface WhatsAppPilotDeliveryExecutionRequest {
  schemaVersion: 1;
  executionRequestId: string;
  requestedAt: string;
  requestedBy: string;
  executionApproverId: string;
  executionApprovalId: string;
  executionApprovedAt: string;
  executionApprovalEvidenceSha256:
    string;
  executionApprovalConfirmed:
    boolean;
  authorizationEvidenceSha256:
    string;
  providerConfigurationEvidenceSha256:
    string;
  endpointIdentityReconfirmed:
    boolean;
  recipientConsentReconfirmed:
    boolean;
  messageContentReconfirmed:
    boolean;
  deliveryLimitReconfirmed:
    boolean;
  authorizationRequest:
    WhatsAppPilotDeliveryAuthorizationRequest;
  authorizationPlan:
    WhatsAppPilotDeliveryAuthorizationPlan;
}

export interface WhatsAppPilotDeliveryExecutionRequestSeal {
  status:
    | 'SEALED_FOR_PILOT_EXECUTOR_REVIEW'
    | 'BLOCKED';
  scope:
    'PHASE_14D_WHATSAPP_PILOT_DELIVERY_EXECUTION_REQUEST';
  executionRequestSealed: boolean;
  executorExposed: false;
  executorInvocationAuthorized: false;
  deliveryStarted: false;
  messageSent: false;
  externalNetworkContacted: false;
  databaseMutated: false;
  executionRequestId: string;
  candidateGitCommit: string;
  environmentId: string;
  endpointUrlSha256: string | null;
  recipientSha256: string | null;
  messageSha256: string;
  deliveryLimit: 1;
  authorizationEvidenceSha256:
    string;
  executionRequestSha256:
    string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

function validTimestamp(
  value: string,
): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function sha256(
  value: string,
): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

export function sealWhatsAppPilotDeliveryExecutionRequest(
  request: WhatsAppPilotDeliveryExecutionRequest,
): WhatsAppPilotDeliveryExecutionRequestSeal {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported WhatsApp pilot execution-request schema version',
    );
  }

  for (const identifier of [
    request.executionRequestId,
    request.requestedBy,
    request.executionApproverId,
    request.executionApprovalId,
  ]) {
    if (
      !IDENTIFIER_PATTERN.test(
        identifier,
      )
    ) {
      errors.push(
        'WhatsApp pilot execution-request identifier is invalid',
      );
      break;
    }
  }

  const recomputedAuthorization =
    buildWhatsAppPilotDeliveryAuthorization(
      request.authorizationRequest,
    );

  if (
    recomputedAuthorization.status !==
      'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION' ||
    !recomputedAuthorization.authorizationValid ||
    !recomputedAuthorization
      .authorizationEvidenceSha256
  ) {
    errors.push(
      'Underlying WhatsApp pilot authorization is invalid',
    );
  }

  if (
    request.authorizationPlan.status !==
      recomputedAuthorization.status ||
    request.authorizationPlan
      .authorizationValid !==
      recomputedAuthorization
        .authorizationValid ||
    request.authorizationPlan
      .authorizationEvidenceSha256 !==
      recomputedAuthorization
        .authorizationEvidenceSha256 ||
    request.authorizationPlan
      .endpointUrlSha256 !==
      recomputedAuthorization
        .endpointUrlSha256 ||
    request.authorizationPlan
      .recipientSha256 !==
      recomputedAuthorization
        .recipientSha256 ||
    request.authorizationPlan
      .messageSha256 !==
      recomputedAuthorization
        .messageSha256
  ) {
    errors.push(
      'Submitted WhatsApp pilot authorization plan does not match recomputation',
    );
  }

  if (
    request.authorizationPlan
      .executorExposed ||
    request.authorizationPlan
      .executorInvocationAuthorized ||
    request.authorizationPlan
      .deliveryStarted ||
    request.authorizationPlan
      .messageSent ||
    request.authorizationPlan
      .externalNetworkContacted ||
    request.authorizationPlan
      .databaseMutated
  ) {
    errors.push(
      'WhatsApp pilot authorization must represent a non-executed state',
    );
  }

  if (
    request.authorizationEvidenceSha256 !==
      recomputedAuthorization
        .authorizationEvidenceSha256 ||
    !SHA256_PATTERN.test(
      request.authorizationEvidenceSha256,
    )
  ) {
    errors.push(
      'WhatsApp pilot authorization evidence digest does not match',
    );
  }

  for (const digest of [
    request
      .executionApprovalEvidenceSha256,
    request
      .providerConfigurationEvidenceSha256,
  ]) {
    if (!SHA256_PATTERN.test(digest)) {
      errors.push(
        'WhatsApp pilot execution evidence digest is invalid',
      );
      break;
    }
  }

  if (
    request.requestedBy !==
      request.authorizationRequest
        .operatorId ||
    request.executionApproverId !==
      request.authorizationRequest
        .approverId ||
    request.requestedBy ===
      request.executionApproverId
  ) {
    errors.push(
      'WhatsApp pilot execution actors do not match the approved separation',
    );
  }

  if (
    request.executionApprovalEvidenceSha256 ===
      request.authorizationRequest
        .approvalEvidenceSha256 ||
    request.executionApprovalEvidenceSha256 ===
      request.authorizationRequest
        .consentEvidenceSha256
  ) {
    errors.push(
      'WhatsApp pilot execution approval evidence must be separate from authorization and consent evidence',
    );
  }

  if (
    !request.executionApprovalConfirmed
  ) {
    errors.push(
      'Separate WhatsApp pilot execution approval confirmation is required',
    );
  }

  if (
    !request.endpointIdentityReconfirmed
  ) {
    errors.push(
      'WhatsApp pilot endpoint identity must be reconfirmed',
    );
  }

  if (
    !request.recipientConsentReconfirmed
  ) {
    errors.push(
      'WhatsApp pilot recipient consent must be reconfirmed',
    );
  }

  if (
    !request.messageContentReconfirmed
  ) {
    errors.push(
      'WhatsApp pilot message content must be reconfirmed',
    );
  }

  if (
    !request.deliveryLimitReconfirmed
  ) {
    errors.push(
      'WhatsApp pilot single-delivery limit must be reconfirmed',
    );
  }

  if (
    !validTimestamp(
      request.requestedAt,
    ) ||
    !validTimestamp(
      request.executionApprovedAt,
    )
  ) {
    errors.push(
      'WhatsApp pilot execution-request timestamp is invalid',
    );
  } else {
    const requestedAt = Date.parse(
      request.requestedAt,
    );
    const executionApprovedAt =
      Date.parse(
        request.executionApprovedAt,
      );
    const authorizationApprovedAt =
      Date.parse(
        request.authorizationRequest
          .approvedAt,
      );
    const validFrom = Date.parse(
      request.authorizationRequest
        .validFrom,
    );
    const expiresAt = Date.parse(
      request.authorizationRequest
        .expiresAt,
    );

    if (
      requestedAt <
        authorizationApprovedAt ||
      requestedAt > validFrom
    ) {
      errors.push(
        'WhatsApp pilot execution request must follow authorization and precede its window',
      );
    }

    if (
      executionApprovedAt <
        requestedAt ||
      executionApprovedAt > validFrom
    ) {
      errors.push(
        'Separate WhatsApp pilot execution approval must follow the request and precede its window',
      );
    }

    if (
      executionApprovedAt >= expiresAt
    ) {
      errors.push(
        'WhatsApp pilot execution approval is outside the authorization window',
      );
    }
  }

  const status =
    errors.length === 0
      ? 'SEALED_FOR_PILOT_EXECUTOR_REVIEW'
      : 'BLOCKED';

  const executionRequestSha256 =
    status ===
      'SEALED_FOR_PILOT_EXECUTOR_REVIEW'
      ? sha256(
          JSON.stringify({
            authorizationEvidenceSha256:
              request
                .authorizationEvidenceSha256,
            candidateGitCommit:
              recomputedAuthorization
                .candidateGitCommit,
            deliveryLimit:
              recomputedAuthorization
                .deliveryLimit,
            endpointUrlSha256:
              recomputedAuthorization
                .endpointUrlSha256,
            environmentId:
              recomputedAuthorization
                .environmentId,
            executionApprovalEvidenceSha256:
              request
                .executionApprovalEvidenceSha256,
            executionApprovalId:
              request.executionApprovalId,
            executionApprovedAt:
              request.executionApprovedAt,
            executionApproverId:
              request.executionApproverId,
            executionRequestId:
              request.executionRequestId,
            messageSha256:
              recomputedAuthorization
                .messageSha256,
            providerConfigurationEvidenceSha256:
              request
                .providerConfigurationEvidenceSha256,
            recipientSha256:
              recomputedAuthorization
                .recipientSha256,
            requestedAt:
              request.requestedAt,
            requestedBy:
              request.requestedBy,
          }),
        )
      : null;

  return {
    status,
    scope:
      'PHASE_14D_WHATSAPP_PILOT_DELIVERY_EXECUTION_REQUEST',
    executionRequestSealed:
      status ===
      'SEALED_FOR_PILOT_EXECUTOR_REVIEW',
    executorExposed: false,
    executorInvocationAuthorized:
      false,
    deliveryStarted: false,
    messageSent: false,
    externalNetworkContacted: false,
    databaseMutated: false,
    executionRequestId:
      request.executionRequestId,
    candidateGitCommit:
      recomputedAuthorization
        .candidateGitCommit,
    environmentId:
      recomputedAuthorization
        .environmentId,
    endpointUrlSha256:
      recomputedAuthorization
        .endpointUrlSha256,
    recipientSha256:
      recomputedAuthorization
        .recipientSha256,
    messageSha256:
      recomputedAuthorization
        .messageSha256,
    deliveryLimit: 1,
    authorizationEvidenceSha256:
      request.authorizationEvidenceSha256,
    executionRequestSha256,
    errors,
  };
}
