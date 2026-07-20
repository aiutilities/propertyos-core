import {
  createHash,
} from 'node:crypto';

import {
  normalizeWhatsAppRecipient,
} from './whatsapp-webhook-notification.provider';

export const PHASE_14C_ACCEPTANCE_PROOF_SHA256 =
  '4384b47e0cd51d1a799515d7385179726d12beba03dbe3df2241cc071a3cf31d';

export const MAX_WHATSAPP_PILOT_AUTHORIZATION_MS =
  60 * 60 * 1000;

export interface WhatsAppPilotDeliveryAuthorizationRequest {
  schemaVersion: 1;
  candidateGitCommit: string;
  phase14cAcceptanceProofSha256:
    string;
  environmentClass: 'PILOT';
  environmentId: string;
  endpointUrl: string;
  recipient: string;
  message: string;
  messageSha256: string;
  consentEvidenceId: string;
  consentEvidenceSha256: string;
  consentRecordedAt: string;
  operatorId: string;
  approverId: string;
  approvalId: string;
  approvalEvidenceSha256: string;
  approvedAt: string;
  validFrom: string;
  expiresAt: string;
  deliveryLimit: 1;
  explicitPilotDeliveryApproval:
    boolean;
}

export interface WhatsAppPilotDeliveryAuthorizationPlan {
  status:
    | 'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION'
    | 'BLOCKED';
  scope:
    'PHASE_14D_WHATSAPP_PILOT_DELIVERY_AUTHORIZATION';
  authorizationValid: boolean;
  executorExposed: false;
  executorInvocationAuthorized: false;
  deliveryStarted: false;
  messageSent: false;
  externalNetworkContacted: false;
  databaseMutated: false;
  candidateGitCommit: string;
  environmentId: string;
  endpointHost: string | null;
  endpointUrlSha256: string | null;
  recipientSha256: string | null;
  messageSha256: string;
  deliveryLimit: 1;
  authorizationEvidenceSha256:
    string | null;
  errors: string[];
}

const COMMIT_PATTERN =
  /^[a-f0-9]{40}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;
const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function sha256(
  value: string,
): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

export function whatsappPilotMessageSha256(
  message: string,
): string {
  return sha256(message);
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

function validateEndpoint(
  value: string,
  errors: string[],
): URL | null {
  let endpoint: URL;

  try {
    endpoint = new URL(value);
  } catch {
    errors.push(
      'Pilot WhatsApp endpoint must be a valid absolute URL',
    );
    return null;
  }

  if (endpoint.protocol !== 'https:') {
    errors.push(
      'Pilot WhatsApp endpoint must use HTTPS',
    );
  }

  if (
    endpoint.username ||
    endpoint.password
  ) {
    errors.push(
      'Pilot WhatsApp endpoint must not contain credentials',
    );
  }

  if (endpoint.hash) {
    errors.push(
      'Pilot WhatsApp endpoint must not contain a fragment',
    );
  }

  if (endpoint.search) {
    errors.push(
      'Pilot WhatsApp endpoint must not contain query parameters',
    );
  }

  return endpoint;
}

export function buildWhatsAppPilotDeliveryAuthorization(
  request: WhatsAppPilotDeliveryAuthorizationRequest,
): WhatsAppPilotDeliveryAuthorizationPlan {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported WhatsApp pilot authorization schema version',
    );
  }

  if (
    !COMMIT_PATTERN.test(
      request.candidateGitCommit,
    )
  ) {
    errors.push(
      'WhatsApp pilot candidate Git commit is invalid',
    );
  }

  if (
    request.phase14cAcceptanceProofSha256 !==
      PHASE_14C_ACCEPTANCE_PROOF_SHA256
  ) {
    errors.push(
      'Phase 14C isolated acceptance proof does not match',
    );
  }

  if (
    request.environmentClass !==
    'PILOT'
  ) {
    errors.push(
      'WhatsApp live delivery authorization requires the pilot environment class',
    );
  }

  for (const identifier of [
    request.environmentId,
    request.consentEvidenceId,
    request.operatorId,
    request.approverId,
    request.approvalId,
  ]) {
    if (
      !IDENTIFIER_PATTERN.test(
        identifier,
      )
    ) {
      errors.push(
        'WhatsApp pilot actor, environment, consent, or approval identifier is invalid',
      );
      break;
    }
  }

  if (
    request.operatorId ===
    request.approverId
  ) {
    errors.push(
      'WhatsApp pilot operator and approver must be different',
    );
  }

  for (const digest of [
    request.messageSha256,
    request.consentEvidenceSha256,
    request.approvalEvidenceSha256,
  ]) {
    if (!SHA256_PATTERN.test(digest)) {
      errors.push(
        'WhatsApp pilot evidence digest is invalid',
      );
      break;
    }
  }

  const calculatedMessageSha256 =
    whatsappPilotMessageSha256(
      request.message,
    );

  if (
    request.messageSha256 !==
    calculatedMessageSha256
  ) {
    errors.push(
      'WhatsApp pilot message digest does not match its content',
    );
  }

  if (
    typeof request.message !==
      'string' ||
    request.message.trim().length === 0 ||
    request.message.length > 4096
  ) {
    errors.push(
      'WhatsApp pilot message must contain 1 to 4096 characters',
    );
  }

  const normalizedRecipient =
    normalizeWhatsAppRecipient(
      request.recipient,
    );

  if (
    normalizedRecipient.status !==
      'READY' ||
    !normalizedRecipient.recipient
  ) {
    errors.push(
      'WhatsApp pilot recipient must use international E.164 format',
    );
  }

  const endpoint = validateEndpoint(
    request.endpointUrl,
    errors,
  );

  if (request.deliveryLimit !== 1) {
    errors.push(
      'WhatsApp pilot authorization permits exactly one delivery',
    );
  }

  const timestamps = [
    request.consentRecordedAt,
    request.approvedAt,
    request.validFrom,
    request.expiresAt,
  ];

  if (
    !timestamps.every(
      validTimestamp,
    )
  ) {
    errors.push(
      'WhatsApp pilot consent, approval, or authorization timestamp is invalid',
    );
  } else {
    const consentRecordedAt =
      Date.parse(
        request.consentRecordedAt,
      );
    const approvedAt = Date.parse(
      request.approvedAt,
    );
    const validFrom = Date.parse(
      request.validFrom,
    );
    const expiresAt = Date.parse(
      request.expiresAt,
    );
    const authorizationLifetime =
      expiresAt - validFrom;

    if (
      consentRecordedAt > approvedAt
    ) {
      errors.push(
        'WhatsApp recipient consent must precede approval',
      );
    }

    if (approvedAt > validFrom) {
      errors.push(
        'WhatsApp pilot approval must precede the authorization window',
      );
    }

    if (
      authorizationLifetime <= 0
    ) {
      errors.push(
        'WhatsApp pilot authorization expiry must follow its start',
      );
    } else if (
      authorizationLifetime >
      MAX_WHATSAPP_PILOT_AUTHORIZATION_MS
    ) {
      errors.push(
        'WhatsApp pilot authorization may not exceed one hour',
      );
    }
  }

  if (
    !request.explicitPilotDeliveryApproval
  ) {
    errors.push(
      'Explicit WhatsApp pilot delivery approval is required',
    );
  }

  const endpointUrlSha256 =
    endpoint
      ? sha256(endpoint.toString())
      : null;

  const status =
    errors.length === 0
      ? 'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION'
      : 'BLOCKED';

  const recipientSha256 =
    normalizedRecipient.recipient
      ? sha256(
          normalizedRecipient.recipient,
        )
      : null;

  const authorizationEvidenceSha256 =
    status ===
      'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION'
      ? sha256(
          JSON.stringify({
            approvalEvidenceSha256:
              request
                .approvalEvidenceSha256,
            approvalId:
              request.approvalId,
            approvedAt:
              request.approvedAt,
            approverId:
              request.approverId,
            candidateGitCommit:
              request
                .candidateGitCommit,
            consentEvidenceId:
              request.consentEvidenceId,
            consentEvidenceSha256:
              request
                .consentEvidenceSha256,
            consentRecordedAt:
              request
                .consentRecordedAt,
            deliveryLimit:
              request.deliveryLimit,
            endpointHost:
              endpoint?.host ?? null,
            endpointUrlSha256,
            environmentClass:
              request.environmentClass,
            environmentId:
              request.environmentId,
            expiresAt:
              request.expiresAt,
            messageSha256:
              calculatedMessageSha256,
            operatorId:
              request.operatorId,
            phase14cAcceptanceProofSha256:
              request
                .phase14cAcceptanceProofSha256,
            recipientSha256,
            validFrom:
              request.validFrom,
          }),
        )
      : null;

  return {
    status,
    scope:
      'PHASE_14D_WHATSAPP_PILOT_DELIVERY_AUTHORIZATION',
    authorizationValid:
      status ===
      'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION',
    executorExposed: false,
    executorInvocationAuthorized:
      false,
    deliveryStarted: false,
    messageSent: false,
    externalNetworkContacted: false,
    databaseMutated: false,
    candidateGitCommit:
      request.candidateGitCommit,
    environmentId:
      request.environmentId,
    endpointHost:
      endpoint?.host ?? null,
    endpointUrlSha256,
    recipientSha256,
    messageSha256:
      calculatedMessageSha256,
    deliveryLimit: 1,
    authorizationEvidenceSha256,
    errors,
  };
}
