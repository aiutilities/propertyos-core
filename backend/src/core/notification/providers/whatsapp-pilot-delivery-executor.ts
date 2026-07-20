import {
  createHash,
} from 'node:crypto';

import {
  NotificationDeliveryResult,
} from '../contracts/notification-provider.contract';
import {
  NotificationMessage,
} from '../types/notification.types';
import {
  evaluateWhatsAppPilotDeliveryExposure,
  WhatsAppPilotDeliveryExposureDecision,
  WhatsAppPilotDeliveryExposureRequest,
} from './whatsapp-pilot-delivery-exposure-policy';

export type WhatsAppPilotDeliveryReservation =
  | 'RESERVED'
  | 'ALREADY_COMPLETED'
  | 'CONFLICT';

export interface WhatsAppPilotDeliverySecurityEvent {
  eventType:
    | 'PILOT_DELIVERY_STARTED'
    | 'PILOT_DELIVERY_COMPLETED'
    | 'PILOT_DELIVERY_FAILED'
    | 'PILOT_DELIVERY_RECONCILIATION_REQUIRED';
  executionRequestSha256: string;
  invocationEvidenceSha256: string;
  actorId: string;
  occurredAt: string;
  detail: string;
}

export interface WhatsAppPilotDeliveryExecutorPorts {
  reserveDelivery(input: {
    invocationApprovalId: string;
    executionRequestSha256: string;
    invocationEvidenceSha256: string;
  }): Promise<WhatsAppPilotDeliveryReservation>;

  deliver(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult>;

  completeDelivery(input: {
    executionRequestSha256: string;
    invocationEvidenceSha256: string;
    providerMessageId: string;
    deliveryEvidenceSha256: string;
    completedAt: string;
  }): Promise<void>;

  failDelivery(input: {
    executionRequestSha256: string;
    invocationEvidenceSha256: string;
    failedAt: string;
    failureCode: string;
  }): Promise<void>;

  recordAmbiguousDelivery(input: {
    executionRequestSha256: string;
    invocationEvidenceSha256: string;
    providerMessageIdSha256: string;
    observedAt: string;
    reconciliationReason: string;
  }): Promise<void>;

  recordSecurityEvent(
    event: WhatsAppPilotDeliverySecurityEvent,
  ): Promise<void>;
}

export interface WhatsAppPilotDeliveryManualInvocation {
  invocationApprovalId: string;
  approvedBy: string;
  operatorId: string;
  authorizedAt: string;
  approvalEvidenceSha256: string;
  explicitInvocationApproval: true;
}

export interface ExecuteWhatsAppPilotDelivery {
  exposureRequest:
    WhatsAppPilotDeliveryExposureRequest;
  exposureDecision:
    WhatsAppPilotDeliveryExposureDecision;
  manualInvocation:
    WhatsAppPilotDeliveryManualInvocation;
  executedAt: string;
}

export interface WhatsAppPilotDeliveryExecutionResult {
  status: 'DELIVERED';
  scope:
    'PHASE_14D_APPROVED_WHATSAPP_PILOT_DELIVERY';
  executionRequestSha256: string;
  invocationEvidenceSha256: string;
  providerName: string;
  providerMessageIdSha256: string;
  deliveryEvidenceSha256: string;
  deliveryCount: 1;
  automaticDelivery: false;
  messageSent: true;
  databaseMutated: false;
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

export function whatsappPilotInvocationEvidenceSha256(
  exposureDecision:
    WhatsAppPilotDeliveryExposureDecision,
  invocation: Omit<
    WhatsAppPilotDeliveryManualInvocation,
    'approvalEvidenceSha256'
  >,
): string {
  return sha256(
    JSON.stringify({
      approvedBy:
        invocation.approvedBy,
      authorizedAt:
        invocation.authorizedAt,
      executionRequestSha256:
        exposureDecision
          .exposureEvidenceSha256,
      invocationApprovalId:
        invocation
          .invocationApprovalId,
      operatorId:
        invocation.operatorId,
    }),
  );
}

export class WhatsAppPilotDeliveryExecutor {
  constructor(
    private readonly ports:
      WhatsAppPilotDeliveryExecutorPorts,
  ) {}

  async execute(
    input: ExecuteWhatsAppPilotDelivery,
  ): Promise<WhatsAppPilotDeliveryExecutionResult> {
    const recomputedDecision =
      evaluateWhatsAppPilotDeliveryExposure(
        input.exposureRequest,
      );

    this.assertInvocationAuthorized(
      input,
      recomputedDecision,
    );

    const executionRequestSha256 =
      input.exposureRequest
        .executionSeal
        .executionRequestSha256!;

    const invocationEvidenceSha256 =
      input.manualInvocation
        .approvalEvidenceSha256;

    const reservation =
      await this.ports.reserveDelivery({
        invocationApprovalId:
          input.manualInvocation
            .invocationApprovalId,
        executionRequestSha256,
        invocationEvidenceSha256,
      });

    if (
      reservation ===
      'ALREADY_COMPLETED'
    ) {
      throw new Error(
        'WHATSAPP_PILOT_DELIVERY_ALREADY_COMPLETED',
      );
    }

    if (reservation !== 'RESERVED') {
      throw new Error(
        'WHATSAPP_PILOT_DELIVERY_RESERVATION_CONFLICT',
      );
    }

    await this.ports.recordSecurityEvent({
      eventType:
        'PILOT_DELIVERY_STARTED',
      executionRequestSha256,
      invocationEvidenceSha256,
      actorId:
        input.manualInvocation
          .operatorId,
      occurredAt: input.executedAt,
      detail:
        'Approved single-message WhatsApp pilot delivery started',
    });

    const authorization =
      input.exposureRequest
        .executionRequest
        .authorizationRequest;

    const notification:
      NotificationMessage = {
      id:
        input.exposureRequest
          .executionRequest
          .executionRequestId,
      channel: 'WHATSAPP',
      recipient:
        authorization.recipient,
      message: authorization.message,
      status: 'PENDING',
      metadata: {
        authorizationEvidenceSha256:
          input.exposureRequest
            .executionRequest
            .authorizationEvidenceSha256,
        executionRequestSha256,
        invocationEvidenceSha256,
      },
      createdAt:
        new Date(input.executedAt),
    };

    let providerDeliverySucceeded =
      false;
    let providerMessageIdSha256:
      string | null = null;

    try {
      const delivery =
        await this.ports.deliver(
          notification,
        );

      if (
        !delivery.success ||
        !delivery.providerMessageId ||
        delivery.providerMessageId
          .trim().length === 0
      ) {
        throw new Error(
          'WHATSAPP_PILOT_PROVIDER_DELIVERY_FAILED',
        );
      }

      providerDeliverySucceeded = true;

      const providerMessageId =
        delivery.providerMessageId.trim();

      providerMessageIdSha256 =
        sha256(providerMessageId);

      const deliveryEvidenceSha256 =
        sha256(
          JSON.stringify({
            executedAt:
              input.executedAt,
            executionRequestSha256,
            invocationEvidenceSha256,
            messageSha256:
              recomputedDecision
                .messageSha256,
            providerMessageIdSha256,
            providerName:
              delivery.providerName,
            recipientSha256:
              recomputedDecision
                .recipientSha256,
          }),
        );

      try {
        await this.ports.completeDelivery({
          executionRequestSha256,
          invocationEvidenceSha256,
          providerMessageId,
          deliveryEvidenceSha256,
          completedAt:
            input.executedAt,
        });
      } catch {
        await this.ports
          .recordAmbiguousDelivery({
            executionRequestSha256,
            invocationEvidenceSha256,
            providerMessageIdSha256,
            observedAt:
              input.executedAt,
            reconciliationReason:
              'PROVIDER_CONFIRMED_PERSISTENCE_FAILED',
          });

        await this.ports
          .recordSecurityEvent({
            eventType:
              'PILOT_DELIVERY_RECONCILIATION_REQUIRED',
            executionRequestSha256,
            invocationEvidenceSha256,
            actorId:
              input.manualInvocation
                .operatorId,
            occurredAt:
              input.executedAt,
            detail:
              'Provider confirmed delivery but completion persistence failed',
          });

        throw new Error(
          'WHATSAPP_PILOT_DELIVERY_COMPLETION_UNCONFIRMED',
        );
      }

      await this.ports.recordSecurityEvent({
        eventType:
          'PILOT_DELIVERY_COMPLETED',
        executionRequestSha256,
        invocationEvidenceSha256,
        actorId:
          input.manualInvocation
            .operatorId,
        occurredAt: input.executedAt,
        detail:
          `Pilot delivery evidence ${deliveryEvidenceSha256}`,
      });

      return {
        status: 'DELIVERED',
        scope:
          'PHASE_14D_APPROVED_WHATSAPP_PILOT_DELIVERY',
        executionRequestSha256,
        invocationEvidenceSha256,
        providerName:
          delivery.providerName,
        providerMessageIdSha256,
        deliveryEvidenceSha256,
        deliveryCount: 1,
        automaticDelivery: false,
        messageSent: true,
        databaseMutated: false,
      };
    } catch (error) {
      if (providerDeliverySucceeded) {
        throw error;
      }

      const failureCode =
        error instanceof Error &&
        error.message ===
          'WHATSAPP_PILOT_PROVIDER_DELIVERY_FAILED'
          ? error.message
          : 'WHATSAPP_PILOT_PROVIDER_EXCEPTION';

      await this.ports.failDelivery({
        executionRequestSha256,
        invocationEvidenceSha256,
        failedAt: input.executedAt,
        failureCode,
      });

      await this.ports.recordSecurityEvent({
        eventType:
          'PILOT_DELIVERY_FAILED',
        executionRequestSha256,
        invocationEvidenceSha256,
        actorId:
          input.manualInvocation
            .operatorId,
        occurredAt: input.executedAt,
        detail:
          'Approved WhatsApp pilot delivery failed',
      });

      throw new Error(failureCode);
    }
  }

  private assertInvocationAuthorized(
    input: ExecuteWhatsAppPilotDelivery,
    recomputedDecision:
      WhatsAppPilotDeliveryExposureDecision,
  ): void {
    if (
      recomputedDecision.status !==
        'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION' ||
      !recomputedDecision
        .exposureEligible ||
      !recomputedDecision
        .exposureEvidenceSha256
    ) {
      throw new Error(
        'WHATSAPP_PILOT_EXPOSURE_NOT_ELIGIBLE',
      );
    }

    if (
      input.exposureDecision.status !==
        recomputedDecision.status ||
      input.exposureDecision
        .exposureEvidenceSha256 !==
        recomputedDecision
          .exposureEvidenceSha256
    ) {
      throw new Error(
        'WHATSAPP_PILOT_EXPOSURE_DECISION_MISMATCH',
      );
    }

    const invocation =
      input.manualInvocation;

    for (const identifier of [
      invocation.invocationApprovalId,
      invocation.approvedBy,
      invocation.operatorId,
    ]) {
      if (
        !IDENTIFIER_PATTERN.test(
          identifier,
        )
      ) {
        throw new Error(
          'WHATSAPP_PILOT_INVOCATION_IDENTIFIER_INVALID',
        );
      }
    }

    if (
      invocation.approvedBy !==
        input.exposureRequest
          .reviewedBy ||
      invocation.operatorId !==
        input.exposureRequest
          .executionOperatorId ||
      invocation.approvedBy ===
        invocation.operatorId
    ) {
      throw new Error(
        'WHATSAPP_PILOT_INVOCATION_ACTOR_MISMATCH',
      );
    }

    if (
      !invocation
        .explicitInvocationApproval
    ) {
      throw new Error(
        'WHATSAPP_PILOT_INVOCATION_APPROVAL_REQUIRED',
      );
    }

    if (
      !validTimestamp(
        invocation.authorizedAt,
      ) ||
      !validTimestamp(
        input.executedAt,
      )
    ) {
      throw new Error(
        'WHATSAPP_PILOT_INVOCATION_TIMESTAMP_INVALID',
      );
    }

    const authorizedAt = Date.parse(
      invocation.authorizedAt,
    );
    const reviewedAt = Date.parse(
      input.exposureRequest.reviewedAt,
    );
    const executedAt = Date.parse(
      input.executedAt,
    );
    const expiresAt = Date.parse(
      input.exposureRequest
        .executionRequest
        .authorizationRequest.expiresAt,
    );

    if (
      authorizedAt < reviewedAt ||
      authorizedAt > executedAt ||
      executedAt >= expiresAt
    ) {
      throw new Error(
        'WHATSAPP_PILOT_INVOCATION_EXPIRED',
      );
    }

    const expectedEvidence =
      whatsappPilotInvocationEvidenceSha256(
        recomputedDecision,
        {
          invocationApprovalId:
            invocation
              .invocationApprovalId,
          approvedBy:
            invocation.approvedBy,
          operatorId:
            invocation.operatorId,
          authorizedAt:
            invocation.authorizedAt,
          explicitInvocationApproval:
            true,
        },
      );

    if (
      !SHA256_PATTERN.test(
        invocation
          .approvalEvidenceSha256,
      ) ||
      invocation
        .approvalEvidenceSha256 !==
        expectedEvidence
    ) {
      throw new Error(
        'WHATSAPP_PILOT_INVOCATION_EVIDENCE_MISMATCH',
      );
    }
  }
}
