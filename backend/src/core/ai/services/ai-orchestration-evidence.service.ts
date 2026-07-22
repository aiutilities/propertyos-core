import { Injectable } from '@nestjs/common';
import { AiFailurePolicyService } from '../resilience/ai-failure-policy.service';
import { AiRecoveryDecisionService } from '../resilience/ai-recovery-decision.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { AiOrchestrationError } from '../errors/ai-orchestration.error';
import {
  AiOrchestrationRequest,
  AiRoutingDecision,
} from '../types/ai-orchestration.types';
import { AiOrchestrationEvidence } from '../types/ai-orchestration-evidence.types';
import { AiGovernanceEvidence } from '../types/ai-governance-evidence.types';
import { AiResponse } from '../types/ai.types';

@Injectable()
export class AiOrchestrationEvidenceService {
  private readonly eventSource = 'core.ai.orchestration';
  private readonly sensitiveKeyPattern =
    /(authorization|api[-_]?key|secret|password|credential|access[-_]?token|refresh[-_]?token)/i;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly failurePolicy: AiFailurePolicyService,
    private readonly recoveryDecision: AiRecoveryDecisionService,
  ) {}

  async recordRequested(options: {
    correlationId: string;
    request: AiOrchestrationRequest;
    decision: AiRoutingDecision;
  }): Promise<void> {
    await this.publish('ai.orchestration.requested', {
      correlationId: options.correlationId,
      tenantId: options.request.tenantId,
      capability: options.request.capability,
      executionMode: options.request.executionMode,
      dataClassification: options.request.dataClassification,
      status: 'REQUESTED',
      selectedProviderName: options.decision.providerName,
      selectedModel: options.decision.model,
      fallbackProviderNames: options.decision.fallbackProviderNames,
      attempts: [],
      metadata: this.sanitizeMetadata(options.request.metadata ?? {}),
      recordedAt: new Date().toISOString(),
    });
  }

  async recordSucceeded(options: {
    correlationId: string;
    request: AiOrchestrationRequest;
    decision: AiRoutingDecision;
    response: AiResponse;
    attempts: AiOrchestrationEvidence['attempts'];
    loop?: AiOrchestrationEvidence['loop'];
  }): Promise<void> {
    await this.publish('ai.orchestration.succeeded', {
      correlationId: options.correlationId,
      tenantId: options.request.tenantId,
      capability: options.request.capability,
      executionMode: options.request.executionMode,
      dataClassification: options.request.dataClassification,
      status: 'SUCCEEDED',
      selectedProviderName: options.decision.providerName,
      selectedModel: options.response.model,
      fallbackProviderNames: options.decision.fallbackProviderNames,
      attempts: options.attempts,
      ...(options.loop
        ? {
            loop: options.loop,
          }
        : {}),
      usage: options.response.usage,
      metadata: this.sanitizeMetadata(options.request.metadata ?? {}),
      recordedAt: new Date().toISOString(),
    });
  }

  async recordFailed(options: {
    correlationId: string;
    request: AiOrchestrationRequest;
    decision?: AiRoutingDecision;
    error: AiOrchestrationError;
    attempts: AiOrchestrationEvidence['attempts'];
  }): Promise<void> {
    await this.publish('ai.orchestration.failed', {
      correlationId: options.correlationId,
      tenantId: options.request.tenantId,
      capability: options.request.capability,
      executionMode: options.request.executionMode,
      dataClassification: options.request.dataClassification,
      status: 'FAILED',
      selectedProviderName: options.decision?.providerName,
      selectedModel: options.decision?.model,
      fallbackProviderNames:
        options.decision?.fallbackProviderNames ??
        options.request.fallbackProviderNames ??
        [],
      attempts: options.attempts,
      failure: {
        code: options.error.code,
        retriable: options.error.retriable,
        classification:
          this.failurePolicy.classify(
            options.error.code,
            options.error.retriable,
          ),
        recovery:
          this.recoveryDecision.decide(
            this.failurePolicy.classify(
              options.error.code,
              options.error.retriable,
            ),
          ),
      },
      metadata: this.sanitizeMetadata(options.request.metadata ?? {}),
      recordedAt: new Date().toISOString(),
    });
  }

  async recordRecoveryStarted(options: {
    correlationId: string;
    tenantId: string;
    action:
      | 'RETRY'
      | 'FALLBACK_PROVIDER'
      | 'REDUCE_CONTEXT'
      | 'REQUEST_PERMISSION'
      | 'STOP';
    attemptNumber: number;
    message: string;
  }): Promise<void> {
    await this.publish(
      'ai.recovery.started',
      {
        correlationId:
          options.correlationId,
        tenantId:
          options.tenantId,
        capability:
          'CHAT',
        executionMode:
          'SIMULATED',
        dataClassification:
          'INTERNAL',
        status:
          'REQUESTED',
        fallbackProviderNames:
          [],
        attempts:
          [],
        recoveryExecution: {
          status:
            'STARTED',
          action:
            options.action,
          attemptNumber:
            options.attemptNumber,
          message:
            options.message,
        },
        metadata:
          {},
        recordedAt:
          new Date().toISOString(),
      },
    );
  }

  async recordRecoveryCompleted(options: {
    correlationId: string;
    tenantId: string;
    action:
      | 'RETRY'
      | 'FALLBACK_PROVIDER'
      | 'REDUCE_CONTEXT'
      | 'REQUEST_PERMISSION'
      | 'STOP';
    attemptNumber: number;
    message: string;
  }): Promise<void> {
    await this.publish(
      'ai.recovery.completed',
      {
        correlationId:
          options.correlationId,
        tenantId:
          options.tenantId,
        capability:
          'CHAT',
        executionMode:
          'SIMULATED',
        dataClassification:
          'INTERNAL',
        status:
          'SUCCEEDED',
        fallbackProviderNames:
          [],
        attempts:
          [],
        recoveryExecution: {
          status:
            'SUCCEEDED',
          action:
            options.action,
          attemptNumber:
            options.attemptNumber,
          message:
            options.message,
        },
        metadata:
          {},
        recordedAt:
          new Date().toISOString(),
      },
    );
  }

  async recordRecoveryFailed(options: {
    correlationId: string;
    tenantId: string;
    action:
      | 'RETRY'
      | 'FALLBACK_PROVIDER'
      | 'REDUCE_CONTEXT'
      | 'REQUEST_PERMISSION'
      | 'STOP';
    attemptNumber: number;
    message: string;
  }): Promise<void> {
    await this.publish(
      'ai.recovery.failed',
      {
        correlationId:
          options.correlationId,
        tenantId:
          options.tenantId,
        capability:
          'CHAT',
        executionMode:
          'SIMULATED',
        dataClassification:
          'INTERNAL',
        status:
          'FAILED',
        fallbackProviderNames:
          [],
        attempts:
          [],
        recoveryExecution: {
          status:
            'FAILED',
          action:
            options.action,
          attemptNumber:
            options.attemptNumber,
          message:
            options.message,
        },
        metadata:
          {},
        recordedAt:
          new Date().toISOString(),
      },
    );
  }


  sanitizeMetadata(
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [
        key,
        this.sensitiveKeyPattern.test(key)
          ? '[REDACTED]'
          : this.sanitizeValue(value),
      ]),
    );
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.sanitizeValue(entry));
    }

    if (value && typeof value === 'object') {
      return this.sanitizeMetadata(value as Record<string, unknown>);
    }

    return value;
  }

  async recordDecisionApproved(
    evidence: AiGovernanceEvidence,
  ): Promise<void> {
    await this.publish(
      'ai.decision.approved',
      {
        ...evidence,
        status: 'APPROVED',
      },
    );
  }


  async recordDecisionRequiresApproval(
    evidence: AiGovernanceEvidence,
  ): Promise<void> {
    await this.publish(
      'ai.decision.requires_approval',
      {
        ...evidence,
        status: 'REQUIRES_APPROVAL',
      },
    );
  }


  async recordDecisionBlocked(
    evidence: AiGovernanceEvidence,
  ): Promise<void> {
    await this.publish(
      'ai.decision.blocked',
      {
        ...evidence,
        status: 'BLOCKED',
      },
    );
  }



  async recordPropertyAction(
    evidence: Record<string, unknown>,
  ): Promise<void> {

    await this.publish(
      'ai.property.action.evidence',
      {
        ...evidence,

        recordedAt:
          new Date().toISOString(),
      },
    );

  }



  private async publish(
    eventName: string,
    evidence: Record<string, unknown>,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      this.eventSource,
      evidence as unknown as Record<string, unknown>,
    );
  }
}
