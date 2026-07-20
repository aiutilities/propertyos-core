import {
  createHash,
} from 'node:crypto';

import {
  NotificationDeliveryResult,
  NotificationProvider,
} from '../contracts/notification-provider.contract';
import {
  NotificationMessage,
} from '../types/notification.types';
import {
  PHASE_14C_ACCEPTANCE_PROOF_SHA256,
} from './whatsapp-pilot-delivery-authorization';
import type {
  WhatsAppWebhookConfiguration,
} from './whatsapp-webhook-configuration';

export interface WhatsAppPilotIsolatedSubstitutionRequest {
  schemaVersion: 1;
  candidateGitCommit: string;
  phase14cAcceptanceProofSha256:
    string;
  executionRequestSha256: string;
  exposureEvidenceSha256: string;
  substitutionReviewId: string;
  reviewedAt: string;
  reviewedBy: string;
  executionOperatorId: string;
  authorizedEndpointUrl: string;
  authorizedEndpointUrlSha256: string;
  authorizedConfigurationEvidenceSha256:
    string;
  isolatedEndpointUrl: string;
  isolatedEndpointReachabilityEvidenceSha256:
    string;
  explicitIsolatedSubstitutionApproval:
    boolean;
  externalNetworkAllowed: false;
}

export interface WhatsAppPilotIsolatedSubstitutionDecision {
  status:
    | 'READY_FOR_ISOLATED_EXECUTOR_EXERCISE'
    | 'BLOCKED';
  scope:
    'PHASE_14D5_ISOLATED_ENDPOINT_SUBSTITUTION';
  substitutionAllowed: boolean;
  environment: 'ISOLATED_LOOPBACK';
  networkBoundary: 'LOOPBACK_ONLY';
  authorizedEndpointUrlSha256:
    string | null;
  isolatedEndpointUrlSha256:
    string | null;
  authorizedConfigurationEvidenceSha256:
    string | null;
  isolatedEndpointReachabilityEvidenceSha256:
    string | null;
  substitutionEvidenceSha256:
    string | null;
  externalNetworkAllowed: false;
  liveWhatsAppContacted: false;
  applicationWired: false;
  databaseMutated: false;
  errors: string[];
}

interface IsolatedWebhookProvider
  extends NotificationProvider {
  validateConfiguration():
    WhatsAppWebhookConfiguration;
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

function validTimestamp(
  value: string,
): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function parseUrl(
  value: string,
): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function validEndpointShape(
  endpoint: URL,
): boolean {
  return (
    endpoint.username.length === 0 &&
    endpoint.password.length === 0 &&
    endpoint.search.length === 0 &&
    endpoint.hash.length === 0
  );
}

function isLiteralLoopbackHost(
  hostname: string,
): boolean {
  return (
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

export function evaluateWhatsAppPilotIsolatedSubstitution(
  request:
    WhatsAppPilotIsolatedSubstitutionRequest,
): WhatsAppPilotIsolatedSubstitutionDecision {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported isolated substitution schema version',
    );
  }

  if (
    !COMMIT_PATTERN.test(
      request.candidateGitCommit,
    )
  ) {
    errors.push(
      'Isolated substitution candidate commit is invalid',
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
    !SHA256_PATTERN.test(
      request.executionRequestSha256,
    )
  ) {
    errors.push(
      'Isolated substitution execution-request evidence is invalid',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request.exposureEvidenceSha256,
    )
  ) {
    errors.push(
      'Isolated substitution exposure evidence is invalid',
    );
  }

  for (const identifier of [
    request.substitutionReviewId,
    request.reviewedBy,
    request.executionOperatorId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Isolated substitution identifier is invalid',
      );
      break;
    }
  }

  if (!validTimestamp(request.reviewedAt)) {
    errors.push(
      'Isolated substitution review timestamp is invalid',
    );
  }

  if (
    request.reviewedBy ===
    request.executionOperatorId
  ) {
    errors.push(
      'Isolated substitution reviewer and execution operator must be different',
    );
  }

  const authorizedEndpoint =
    parseUrl(request.authorizedEndpointUrl);

  if (!authorizedEndpoint) {
    errors.push(
      'Authorized WhatsApp endpoint must be a valid absolute URL',
    );
  } else {
    if (
      authorizedEndpoint.protocol !==
      'https:'
    ) {
      errors.push(
        'Authorized WhatsApp endpoint must use HTTPS',
      );
    }

    if (
      !validEndpointShape(
        authorizedEndpoint,
      )
    ) {
      errors.push(
        'Authorized WhatsApp endpoint must not contain credentials, query parameters, or fragments',
      );
    }

    if (
      isLiteralLoopbackHost(
        authorizedEndpoint.hostname,
      )
    ) {
      errors.push(
        'Authorized WhatsApp endpoint must not be a loopback endpoint',
      );
    }
  }

  const recomputedAuthorizedEndpointSha256 =
    authorizedEndpoint
      ? sha256(
          authorizedEndpoint.toString(),
        )
      : null;

  if (
    !SHA256_PATTERN.test(
      request.authorizedEndpointUrlSha256,
    ) ||
    request.authorizedEndpointUrlSha256 !==
      recomputedAuthorizedEndpointSha256
  ) {
    errors.push(
      'Authorized WhatsApp endpoint digest does not match',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request
        .authorizedConfigurationEvidenceSha256,
    )
  ) {
    errors.push(
      'Authorized WhatsApp configuration evidence is invalid',
    );
  }

  const isolatedEndpoint =
    parseUrl(request.isolatedEndpointUrl);

  if (!isolatedEndpoint) {
    errors.push(
      'Isolated WhatsApp endpoint must be a valid absolute URL',
    );
  } else {
    if (
      isolatedEndpoint.protocol !==
        'http:' &&
      isolatedEndpoint.protocol !==
        'https:'
    ) {
      errors.push(
        'Isolated WhatsApp endpoint must use HTTP or HTTPS',
      );
    }

    if (
      !isLiteralLoopbackHost(
        isolatedEndpoint.hostname,
      )
    ) {
      errors.push(
        'Isolated WhatsApp endpoint must use a literal loopback address',
      );
    }

    if (
      !validEndpointShape(
        isolatedEndpoint,
      )
    ) {
      errors.push(
        'Isolated WhatsApp endpoint must not contain credentials, query parameters, or fragments',
      );
    }
  }

  const isolatedEndpointUrlSha256 =
    isolatedEndpoint
      ? sha256(isolatedEndpoint.toString())
      : null;

  if (
    !SHA256_PATTERN.test(
      request
        .isolatedEndpointReachabilityEvidenceSha256,
    )
  ) {
    errors.push(
      'Isolated endpoint reachability evidence is invalid',
    );
  }

  if (
    recomputedAuthorizedEndpointSha256 &&
    isolatedEndpointUrlSha256 &&
    recomputedAuthorizedEndpointSha256 ===
      isolatedEndpointUrlSha256
  ) {
    errors.push(
      'Authorized and isolated endpoints must be different',
    );
  }

  if (
    request
      .explicitIsolatedSubstitutionApproval !==
    true
  ) {
    errors.push(
      'Explicit isolated endpoint substitution approval is required',
    );
  }

  if (
    request.externalNetworkAllowed !==
    false
  ) {
    errors.push(
      'External network access must be forbidden for isolated substitution',
    );
  }

  const substitutionEvidenceSha256 =
    errors.length === 0 &&
    recomputedAuthorizedEndpointSha256 &&
    isolatedEndpointUrlSha256
      ? sha256(
          JSON.stringify({
            candidateGitCommit:
              request.candidateGitCommit,
            phase14cAcceptanceProofSha256:
              request
                .phase14cAcceptanceProofSha256,
            executionRequestSha256:
              request.executionRequestSha256,
            exposureEvidenceSha256:
              request.exposureEvidenceSha256,
            authorizedConfigurationEvidenceSha256:
              request
                .authorizedConfigurationEvidenceSha256,
            authorizedEndpointUrlSha256:
              recomputedAuthorizedEndpointSha256,
            executionOperatorId:
              request.executionOperatorId,
            externalNetworkAllowed:
              false,
            isolatedEndpointReachabilityEvidenceSha256:
              request
                .isolatedEndpointReachabilityEvidenceSha256,
            isolatedEndpointUrlSha256,
            reviewedAt:
              request.reviewedAt,
            reviewedBy:
              request.reviewedBy,
            substitutionReviewId:
              request.substitutionReviewId,
          }),
        )
      : null;

  const substitutionAllowed =
    errors.length === 0 &&
    substitutionEvidenceSha256 !== null;

  return {
    status: substitutionAllowed
      ? 'READY_FOR_ISOLATED_EXECUTOR_EXERCISE'
      : 'BLOCKED',
    scope:
      'PHASE_14D5_ISOLATED_ENDPOINT_SUBSTITUTION',
    substitutionAllowed,
    environment:
      'ISOLATED_LOOPBACK',
    networkBoundary:
      'LOOPBACK_ONLY',
    authorizedEndpointUrlSha256:
      recomputedAuthorizedEndpointSha256,
    isolatedEndpointUrlSha256,
    authorizedConfigurationEvidenceSha256:
      SHA256_PATTERN.test(
        request
          .authorizedConfigurationEvidenceSha256,
      )
        ? request
            .authorizedConfigurationEvidenceSha256
        : null,
    isolatedEndpointReachabilityEvidenceSha256:
      SHA256_PATTERN.test(
        request
          .isolatedEndpointReachabilityEvidenceSha256,
      )
        ? request
            .isolatedEndpointReachabilityEvidenceSha256
        : null,
    substitutionEvidenceSha256,
    externalNetworkAllowed: false,
    liveWhatsAppContacted: false,
    applicationWired: false,
    databaseMutated: false,
    errors,
  };
}

export class WhatsAppPilotIsolatedSubstitutionAdapter
  implements NotificationProvider
{
  readonly name =
    'whatsapp-pilot-isolated-substitution';

  readonly channel = 'WHATSAPP' as const;

  constructor(
    private readonly provider:
      IsolatedWebhookProvider,
    private readonly request:
      WhatsAppPilotIsolatedSubstitutionRequest,
  ) {}

  validate():
    WhatsAppPilotIsolatedSubstitutionDecision {
    const decision =
      evaluateWhatsAppPilotIsolatedSubstitution(
        this.request,
      );

    if (!decision.substitutionAllowed) {
      return decision;
    }

    const configuration =
      this.provider.validateConfiguration();

    if (
      configuration.status !== 'READY' ||
      !configuration.webhookUrl
    ) {
      return {
        ...decision,
        status: 'BLOCKED',
        substitutionAllowed: false,
        substitutionEvidenceSha256:
          null,
        errors: [
          ...decision.errors,
          'Isolated webhook provider configuration is not ready',
        ],
      };
    }

    const configuredEndpoint =
      parseUrl(configuration.webhookUrl);

    if (
      !configuredEndpoint ||
      configuredEndpoint.toString() !==
        new URL(
          this.request.isolatedEndpointUrl,
        ).toString()
    ) {
      return {
        ...decision,
        status: 'BLOCKED',
        substitutionAllowed: false,
        substitutionEvidenceSha256:
          null,
        errors: [
          ...decision.errors,
          'Isolated webhook provider endpoint does not match the approved substitution',
        ],
      };
    }

    return decision;
  }

  async send(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    const decision = this.validate();

    if (!decision.substitutionAllowed) {
      return {
        success: false,
        providerName: this.name,
        error:
          'WHATSAPP_PILOT_ISOLATED_SUBSTITUTION_BLOCKED',
        metadata: {
          scope: decision.scope,
          networkBoundary:
            decision.networkBoundary,
        },
      };
    }

    return this.provider.send(notification);
  }
}
