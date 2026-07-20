import {
  createHash,
} from 'node:crypto';

import {
  sealWhatsAppPilotDeliveryExecutionRequest,
  WhatsAppPilotDeliveryExecutionRequest,
  WhatsAppPilotDeliveryExecutionRequestSeal,
} from './whatsapp-pilot-delivery-execution-request';
import {
  resolveWhatsAppWebhookConfiguration,
  WhatsAppWebhookConfigurationInput,
  whatsappWebhookConfigurationEvidenceSha256,
} from './whatsapp-webhook-configuration';

export interface WhatsAppPilotDeliveryExposureRequest {
  schemaVersion: 1;
  reviewId: string;
  reviewedAt: string;
  reviewedBy: string;
  executionOperatorId: string;
  endpointReachabilityEvidenceSha256:
    string;
  endpointReachabilityConfirmed:
    boolean;
  explicitExecutorExposureApproval:
    boolean;
  webhookConfiguration:
    WhatsAppWebhookConfigurationInput;
  executionRequest:
    WhatsAppPilotDeliveryExecutionRequest;
  executionSeal:
    WhatsAppPilotDeliveryExecutionRequestSeal;
}

export interface WhatsAppPilotDeliveryExposureDecision {
  status:
    | 'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION'
    | 'BLOCKED';
  scope:
    'PHASE_14D_WHATSAPP_PILOT_EXECUTOR_EXPOSURE_POLICY';
  exposureEligible: boolean;
  executorExposed: false;
  executorInvocationAuthorized: false;
  deliveryStarted: false;
  messageSent: false;
  externalNetworkContacted: false;
  databaseMutated: false;
  reviewId: string;
  executionRequestId: string;
  candidateGitCommit: string;
  environmentId: string;
  endpointHost: string | null;
  endpointUrlSha256: string | null;
  recipientSha256: string | null;
  messageSha256: string;
  deliveryLimit: 1;
  configurationEvidenceSha256:
    string | null;
  exposureEvidenceSha256:
    string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

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

export function evaluateWhatsAppPilotDeliveryExposure(
  request: WhatsAppPilotDeliveryExposureRequest,
): WhatsAppPilotDeliveryExposureDecision {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported WhatsApp pilot exposure-policy schema version',
    );
  }

  for (const identifier of [
    request.reviewId,
    request.reviewedBy,
    request.executionOperatorId,
  ]) {
    if (
      !IDENTIFIER_PATTERN.test(
        identifier,
      )
    ) {
      errors.push(
        'WhatsApp pilot exposure review identifier is invalid',
      );
      break;
    }
  }

  const recomputedSeal =
    sealWhatsAppPilotDeliveryExecutionRequest(
      request.executionRequest,
    );

  if (
    recomputedSeal.status !==
      'SEALED_FOR_PILOT_EXECUTOR_REVIEW' ||
    !recomputedSeal
      .executionRequestSealed ||
    !recomputedSeal
      .executionRequestSha256
  ) {
    errors.push(
      'WhatsApp pilot execution request is not validly sealed',
    );
  }

  if (
    request.executionSeal.status !==
      recomputedSeal.status ||
    request.executionSeal
      .executionRequestSealed !==
      recomputedSeal
        .executionRequestSealed ||
    request.executionSeal
      .executionRequestSha256 !==
      recomputedSeal
        .executionRequestSha256 ||
    request.executionSeal
      .authorizationEvidenceSha256 !==
      recomputedSeal
        .authorizationEvidenceSha256
  ) {
    errors.push(
      'Submitted WhatsApp pilot execution seal does not match recomputation',
    );
  }

  if (
    request.executionSeal
      .executorExposed ||
    request.executionSeal
      .executorInvocationAuthorized ||
    request.executionSeal
      .deliveryStarted ||
    request.executionSeal.messageSent ||
    request.executionSeal
      .externalNetworkContacted ||
    request.executionSeal
      .databaseMutated
  ) {
    errors.push(
      'WhatsApp pilot execution seal must represent a non-executed state',
    );
  }

  const configuration =
    resolveWhatsAppWebhookConfiguration(
      request.webhookConfiguration,
    );

  const configurationEvidenceSha256 =
    whatsappWebhookConfigurationEvidenceSha256(
      configuration,
    );

  if (
    configuration.status !== 'READY' ||
    !configurationEvidenceSha256
  ) {
    errors.push(
      'WhatsApp pilot provider configuration is not ready',
    );
  }

  if (
    request.webhookConfiguration
      .environmentClass !==
    'PRODUCTION'
  ) {
    errors.push(
      'WhatsApp pilot exposure requires production-grade webhook configuration',
    );
  }

  if (
    configurationEvidenceSha256 !==
    request.executionRequest
      .providerConfigurationEvidenceSha256
  ) {
    errors.push(
      'WhatsApp provider configuration changed after execution-request sealing',
    );
  }

  const configuredEndpointUrlSha256 =
    configuration.webhookUrl
      ? sha256(
          configuration.webhookUrl,
        )
      : null;

  if (
    configuredEndpointUrlSha256 !==
    recomputedSeal.endpointUrlSha256
  ) {
    errors.push(
      'WhatsApp pilot endpoint does not match the sealed authorization',
    );
  }

  if (
    request.executionOperatorId !==
      request.executionRequest
        .requestedBy ||
    request.reviewedBy !==
      request.executionRequest
        .executionApproverId ||
    request.executionOperatorId ===
      request.reviewedBy
  ) {
    errors.push(
      'WhatsApp pilot exposure actors do not match the approved separation',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request
        .endpointReachabilityEvidenceSha256,
    )
  ) {
    errors.push(
      'WhatsApp pilot endpoint reachability evidence digest is invalid',
    );
  }

  if (
    request
      .endpointReachabilityEvidenceSha256 ===
      configurationEvidenceSha256 ||
    request
      .endpointReachabilityEvidenceSha256 ===
      recomputedSeal
        .executionRequestSha256
  ) {
    errors.push(
      'WhatsApp pilot endpoint reachability evidence must be independently produced',
    );
  }

  if (
    !request.endpointReachabilityConfirmed
  ) {
    errors.push(
      'WhatsApp pilot endpoint reachability must be confirmed',
    );
  }

  if (!validTimestamp(request.reviewedAt)) {
    errors.push(
      'WhatsApp pilot exposure review timestamp is invalid',
    );
  } else {
    const reviewedAt = Date.parse(
      request.reviewedAt,
    );
    const validFrom = Date.parse(
      request.executionRequest
        .authorizationRequest.validFrom,
    );
    const expiresAt = Date.parse(
      request.executionRequest
        .authorizationRequest.expiresAt,
    );

    if (
      reviewedAt < validFrom ||
      reviewedAt >= expiresAt
    ) {
      errors.push(
        'WhatsApp pilot exposure review is outside the authorization window',
      );
    }
  }

  if (
    !request
      .explicitExecutorExposureApproval
  ) {
    errors.push(
      'Explicit WhatsApp pilot executor exposure approval is required',
    );
  }

  const status =
    errors.length === 0
      ? 'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION'
      : 'BLOCKED';

  const exposureEvidenceSha256 =
    status ===
      'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION'
      ? sha256(
          JSON.stringify({
            candidateGitCommit:
              recomputedSeal
                .candidateGitCommit,
            configurationEvidenceSha256,
            endpointReachabilityEvidenceSha256:
              request
                .endpointReachabilityEvidenceSha256,
            endpointUrlSha256:
              recomputedSeal
                .endpointUrlSha256,
            environmentId:
              recomputedSeal.environmentId,
            executionOperatorId:
              request.executionOperatorId,
            executionRequestSha256:
              recomputedSeal
                .executionRequestSha256,
            messageSha256:
              recomputedSeal.messageSha256,
            recipientSha256:
              recomputedSeal
                .recipientSha256,
            reviewId: request.reviewId,
            reviewedAt:
              request.reviewedAt,
            reviewedBy:
              request.reviewedBy,
          }),
        )
      : null;

  return {
    status,
    scope:
      'PHASE_14D_WHATSAPP_PILOT_EXECUTOR_EXPOSURE_POLICY',
    exposureEligible:
      status ===
      'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION',
    executorExposed: false,
    executorInvocationAuthorized:
      false,
    deliveryStarted: false,
    messageSent: false,
    externalNetworkContacted: false,
    databaseMutated: false,
    reviewId: request.reviewId,
    executionRequestId:
      request.executionRequest
        .executionRequestId,
    candidateGitCommit:
      recomputedSeal.candidateGitCommit,
    environmentId:
      recomputedSeal.environmentId,
    endpointHost:
      configuration.webhookUrl
        ? new URL(
            configuration.webhookUrl,
          ).host
        : null,
    endpointUrlSha256:
      recomputedSeal.endpointUrlSha256,
    recipientSha256:
      recomputedSeal.recipientSha256,
    messageSha256:
      recomputedSeal.messageSha256,
    deliveryLimit: 1,
    configurationEvidenceSha256,
    exposureEvidenceSha256,
    errors,
  };
}
