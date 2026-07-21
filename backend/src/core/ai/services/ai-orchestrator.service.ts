import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  AiOrchestrationError,
  AiOrchestrationFailureCode,
} from '../errors/ai-orchestration.error';
import {
  AiDispatchExecutionCoordinatorService,
} from '../dispatch/ai-dispatch-execution-coordinator.service';
import {
  AiPreparedRequestDispatchBoundaryService,
} from '../dispatch/ai-prepared-request-dispatch-boundary.service';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import {
  AiRequestPreparationService,
} from '../request/ai-request-preparation.service';
import {
  AiOrchestrationAttempt,
  AiOrchestrationRequest,
  AiOrchestrationResult,
} from '../types/ai-orchestration.types';
import {
  AiPreparedRequestDispatchProtocol,
} from '../types/ai-prepared-request-dispatch.types';
import { AiResponse } from '../types/ai.types';
import { AiOrchestrationEvidenceService } from './ai-orchestration-evidence.service';
import { AiRoutingPolicyService } from './ai-routing-policy.service';

@Injectable()
export class AiOrchestratorService {
  private readonly defaultTimeoutMs = 30_000;

  constructor(
    private readonly routingPolicy:
      AiRoutingPolicyService,
    private readonly registry:
      AiProviderRegistry,
    private readonly evidence:
      AiOrchestrationEvidenceService,
    private readonly requestPreparation:
      AiRequestPreparationService =
        new AiRequestPreparationService(),
    private readonly dispatchBoundary:
      AiPreparedRequestDispatchBoundaryService =
        new AiPreparedRequestDispatchBoundaryService(),
    private readonly executionCoordinator:
      AiDispatchExecutionCoordinatorService =
        new AiDispatchExecutionCoordinatorService(
          registry,
        ),
  ) {}

  async execute(
    request: AiOrchestrationRequest,
  ): Promise<AiOrchestrationResult> {
    const correlationId = request.correlationId?.trim() || randomUUID();
    const attempts: AiOrchestrationAttempt[] = [];
    let decision;

    try {
      decision = this.routingPolicy.decide(request);

      await this.evidence.recordRequested({
        correlationId,
        request,
        decision,
      });

      const providerNames = [
        decision.providerName,
        ...decision.fallbackProviderNames,
      ];

      const failures: Array<{
        providerName: string;
        code: AiOrchestrationFailureCode;
        message: string;
      }> = [];

      for (const [index, providerName] of providerNames.entries()) {
        const attempt = index + 1;
        const startedAtDate = new Date();
        const startedAt = startedAtDate.toISOString();

        try {
          const response = await this.executeProvider({
            providerName,
            attempt,
            request,
            selectedModel:
              providerName === decision.providerName
                ? decision.model
                : request.model,
          });

          this.assertTokenBudget(response, request, providerName, attempt);

          const completedAtDate = new Date();
          const completedAttempt: AiOrchestrationAttempt = {
            providerName,
            attempt,
            status: 'SUCCEEDED',
            startedAt,
            completedAt: completedAtDate.toISOString(),
            durationMs: Math.max(
              0,
              completedAtDate.getTime() - startedAtDate.getTime(),
            ),
          };

          attempts.push(completedAttempt);

          const resolvedDecision = {
            ...decision,
            providerName,
            model: response.model,
          };

          await this.evidence.recordSucceeded({
            correlationId,
            request,
            decision: resolvedDecision,
            response,
            attempts,
          });

          return {
            correlationId,
            response,
            decision: resolvedDecision,
            attempts,
          };
        } catch (error) {
          const completedAtDate = new Date();
          const normalized = this.normalizeFailure(
            error,
            providerName,
            attempt,
          );

          attempts.push({
            providerName,
            attempt,
            status: 'FAILED',
            failureCode: normalized.code,
            startedAt,
            completedAt: completedAtDate.toISOString(),
            durationMs: Math.max(
              0,
              completedAtDate.getTime() - startedAtDate.getTime(),
            ),
          });

          failures.push({
            providerName,
            code: normalized.code,
            message: normalized.message,
          });

          if (!normalized.retriable) {
            throw normalized;
          }
        }
      }

      throw new AiOrchestrationError({
        code: 'ALL_PROVIDERS_FAILED',
        message: 'All eligible AI providers failed',
        retriable: false,
        details: {
          failures,
        },
      });
    } catch (error) {
      const normalized =
        error instanceof AiOrchestrationError
          ? error
          : new AiOrchestrationError({
              code: 'PROVIDER_EXECUTION_FAILED',
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown AI orchestration failure',
              retriable: false,
            });

      await this.evidence.recordFailed({
        correlationId,
        request,
        decision,
        error: normalized,
        attempts,
      });

      throw normalized;
    }
  }

  private async executeProvider(
    options: {
      providerName: string;
      attempt: number;
      request:
        AiOrchestrationRequest;
      selectedModel?: string;
    },
  ): Promise<AiResponse> {
    const provider =
      this.registry.get(
        options.providerName,
      );

    if (!provider) {
      throw new AiOrchestrationError({
        code:
          'PROVIDER_NOT_FOUND',
        message:
          `AI provider not found: ${options.providerName}`,
        retriable:
          true,
        details: {
          providerName:
            options.providerName,
          attempt:
            options.attempt,
        },
      });
    }

    const timeoutMs =
      options.request.timeoutMs ??
      this.defaultTimeoutMs;

    if (
      !Number.isInteger(
        timeoutMs,
      ) ||
      timeoutMs <= 0
    ) {
      throw new AiOrchestrationError({
        code:
          'PROVIDER_EXECUTION_FAILED',
        message:
          'AI provider timeout must be a positive integer',
        retriable:
          false,
        details: {
          providerName:
            options.providerName,
          attempt:
            options.attempt,
          timeoutMs,
        },
      });
    }

    const descriptor =
      provider.getProvider();

    const model =
      options.selectedModel ??
      descriptor.defaultModel ??
      provider.manifest
        .models[0]?.id;

    if (!model) {
      throw new AiOrchestrationError({
        code:
          'PROVIDER_EXECUTION_FAILED',
        message:
          `AI provider has no executable model: ${options.providerName}`,
        retriable:
          false,
        details: {
          providerName:
            options.providerName,
          attempt:
            options.attempt,
        },
      });
    }

    const maximumOutputTokens =
      options.request.maxTokens ??
      options.request.tokenBudget
        ?.maxOutputTokens ??
      provider.manifest.limits
        .maxOutputTokens ??
      1024;

    const preparedRequest =
      this.requestPreparation.prepare({
        provider:
          options.providerName,
        model,
        messages:
          options.request.messages,
        generation: {
          temperature:
            options.request
              .temperature,
          maxOutputTokens:
            maximumOutputTokens,
        },
        metadata: {
          ...(options.request
            .metadata ?? {}),
          propertyOsTenantId:
            options.request.tenantId,
          propertyOsCapability:
            options.request
              .capability,
          propertyOsExecutionMode:
            options.request
              .executionMode,
          propertyOsDataClassification:
            options.request
              .dataClassification,
          propertyOsCorrelationId:
            options.request
              .correlationId,
          propertyOsAttempt:
            options.attempt,
        },
      });

    const protocol =
      this.resolveDispatchProtocol(
        options.providerName,
        provider.manifest
          .metadata,
      );

    const runtimeProvider =
      this.resolveRuntimeProvider(
        options.providerName,
        provider.manifest
          .metadata,
      );

    const envelope =
      this.dispatchBoundary
        .createEnvelope({
          request:
            preparedRequest,
          target: {
            provider:
              options.providerName,
            runtimeProvider,
            protocol,
            model,
            enabled:
              descriptor.status ===
              'ACTIVE',
            metadata: {
              providerId:
                descriptor.id,
              providerDisplayName:
                descriptor
                  .displayName,
              orchestrationAttempt:
                options.attempt,
            },
          },
          metadata: {
            correlationId:
              options.request
                .correlationId,
            tenantId:
              options.request
                .tenantId,
            executionMode:
              options.request
                .executionMode,
          },
        });

    const execution =
      this.executionCoordinator
        .execute({
          envelope,
          metadata: {
            correlationId:
              options.request
                .correlationId,
            tenantId:
              options.request
                .tenantId,
            attempt:
              options.attempt,
          },
        });

    const result =
      await this.withTimeout(
        execution,
        timeoutMs,
        options.providerName,
        options.attempt,
      );

    return result.response;
  }

  private resolveDispatchProtocol(
    providerName:
      string,
    metadata:
      Readonly<
        Record<string, unknown>
      >,
  ): AiPreparedRequestDispatchProtocol {
    const declaredProtocol =
      metadata.protocol;

    if (
      typeof declaredProtocol ===
        'string' &&
      declaredProtocol.trim()
    ) {
      const normalized =
        declaredProtocol
          .trim()
          .replace(
            /[-\s]+/g,
            '_',
          )
          .toUpperCase();

      if (
        normalized ===
        'OPENAI_COMPATIBLE' ||
        normalized ===
        'ANTHROPIC_MESSAGES'
      ) {
        return normalized;
      }
    }

    return providerName
      .trim()
      .toLowerCase() ===
      'claude'
      ? 'ANTHROPIC_MESSAGES'
      : 'OPENAI_COMPATIBLE';
  }

  private resolveRuntimeProvider(
    providerName:
      string,
    metadata:
      Readonly<
        Record<string, unknown>
      >,
  ): string {
    const declaredRuntime =
      metadata.runtimeProvider ??
      metadata.runtime;

    if (
      typeof declaredRuntime ===
        'string' &&
      declaredRuntime.trim()
    ) {
      return declaredRuntime.trim();
    }

    return `${providerName.trim()}-runtime`;
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    providerName: string,
    attempt: number,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new AiOrchestrationError({
            code: 'PROVIDER_TIMEOUT',
            message: `AI provider timed out: ${providerName}`,
            retriable: true,
            details: {
              providerName,
              attempt,
              timeoutMs,
            },
          }),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private assertTokenBudget(
    response: AiResponse,
    request: AiOrchestrationRequest,
    providerName: string,
    attempt: number,
  ): void {
    const allowedTotalTokens = request.tokenBudget?.maxTotalTokens;
    const observedTotalTokens = response.usage?.totalTokens;

    if (
      allowedTotalTokens !== undefined &&
      observedTotalTokens !== undefined &&
      observedTotalTokens > allowedTotalTokens
    ) {
      throw new AiOrchestrationError({
        code: 'TOKEN_BUDGET_EXCEEDED',
        message: `AI response exceeded the total-token budget for provider ${providerName}`,
        retriable: false,
        details: {
          providerName,
          attempt,
          observedTotalTokens,
          allowedTotalTokens,
        },
      });
    }
  }

  private normalizeFailure(
    error: unknown,
    providerName: string,
    attempt: number,
  ): AiOrchestrationError {
    if (error instanceof AiOrchestrationError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : 'Unknown AI provider failure';

    return new AiOrchestrationError({
      code: 'PROVIDER_EXECUTION_FAILED',
      message: `AI provider execution failed: ${providerName}: ${message}`,
      retriable: true,
      details: {
        providerName,
        attempt,
      },
    });
  }
}
