import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  AiOrchestrationError,
  AiOrchestrationFailureCode,
} from '../errors/ai-orchestration.error';
import {
  AiProviderFailoverError,
} from '../errors/ai-provider-failover.error';
import {
  AiDispatchExecutionCoordinatorService,
} from '../dispatch/ai-dispatch-execution-coordinator.service';
import {
  AiExecutionContextService,
} from '../execution/ai-execution-context.service';
import {
  AiPreparedRequestDispatchBoundaryService,
} from '../dispatch/ai-prepared-request-dispatch-boundary.service';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import {
  AiProviderFailoverService,
} from '../resilience/ai-provider-failover.service';
import {
  AiRequestPreparationService,
} from '../request/ai-request-preparation.service';
import {
  AiOrchestrationAttempt,
  AiOrchestrationRequest,
  AiOrchestrationResult,
} from '../types/ai-orchestration.types';
import {
  AiProviderFailoverAttemptEvidence,
  AiProviderFailoverFailureCode,
} from '../types/ai-provider-failover.types';
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
    private readonly executionContext:
      AiExecutionContextService =
        new AiExecutionContextService(),
    private readonly failover:
      AiProviderFailoverService =
        new AiProviderFailoverService(),
  ) {}

  async execute(
    request: AiOrchestrationRequest,
  ): Promise<AiOrchestrationResult> {
    const correlationId =
      request.correlationId?.trim() ||
      randomUUID();

    const attempts:
      AiOrchestrationAttempt[] = [];

    let decision;

    try {
      decision =
        this.routingPolicy.decide(
          request,
        );

      await this.evidence.recordRequested({
        correlationId,
        request,
        decision,
      });

      const candidates =
        this.createFailoverCandidates(
          decision.providerName,
          decision.model,
          decision.fallbackProviderNames,
          request,
        );

      const failures =
        new Map<
          number,
          AiOrchestrationError
        >();

      const result =
        await this.failover.execute({
          candidates,
          maximumAttemptsPerProvider:
            1,
          retryDelayMs:
            0,
          retryableFailureCodes: [
            'AI_PROVIDER_TIMEOUT',
            'AI_PROVIDER_RATE_LIMITED',
            'AI_PROVIDER_OUTAGE',
          ],
          execute:
            async (
              candidate,
              context,
            ) => {
              try {
                const response =
                  await this.executeProvider({
                    providerName:
                      candidate.providerName,
                    attempt:
                      context
                        .globalAttemptNumber,
                    correlationId,
                    startedAt:
                      new Date()
                        .toISOString(),
                    request,
                    selectedModel:
                      candidate.model,
                  });

                this.assertTokenBudget(
                  response,
                  request,
                  candidate.providerName,
                  context
                    .globalAttemptNumber,
                );

                return {
                  status:
                    'SUCCEEDED' as const,
                  response,
                };
              } catch (error) {
                const normalized =
                  this.normalizeFailure(
                    error,
                    candidate.providerName,
                    context
                      .globalAttemptNumber,
                  );

                failures.set(
                  context.globalAttemptNumber,
                  normalized,
                );

                /*
                 * A fatal orchestration policy failure must stop the
                 * whole operation, not merely move to another provider.
                 *
                 * Returning a typed fatal result causes the canonical
                 * failover service to stop immediately while preserving
                 * its generic provider-failover semantics.
                 */
                if (!normalized.retriable) {
                  return {
                    status:
                      'FATAL' as const,
                    error:
                      normalized,
                  };
                }

                throw Object.assign(
                  new Error(
                    normalized.message,
                  ),
                  {
                    code:
                      this.toFailoverFailureCode(
                        normalized,
                      ),
                  },
                );
              }
            },
        });

      attempts.push(
        ...this.toOrchestrationAttempts(
          result.evidence.attempts,
          failures,
        ),
      );

      if (
        result.response.status ===
        'FATAL'
      ) {
        throw result.response.error;
      }

      const response =
        result.response.response;

      const resolvedDecision = {
        ...decision,
        providerName:
          result.providerName,
        model:
          response.model ??
          result.model,
      };

      await this.evidence.recordSucceeded({
        correlationId,
        request,
        decision:
          resolvedDecision,
        response,
        attempts,
      });

      return {
        correlationId,
        response,
        decision:
          resolvedDecision,
        attempts,
      };
    } catch (error) {
      if (
        error instanceof
        AiProviderFailoverError
      ) {
        const failureMap =
          this.collectFailoverFailures(
            error.evidence.attempts,
          );

        attempts.splice(
          0,
          attempts.length,
          ...this.toOrchestrationAttempts(
            error.evidence.attempts,
            failureMap,
          ),
        );

        const exhausted =
          new AiOrchestrationError({
            code:
              'ALL_PROVIDERS_FAILED',
            message:
              'All eligible AI providers failed',
            retriable:
              false,
            details: {
              failures:
                error.evidence.attempts
                  .filter(
                    attempt =>
                      attempt.outcome ===
                      'FAILED',
                  )
                  .map(attempt => {
                    const normalized =
                      failureMap.get(
                        attempt
                          .globalAttemptNumber,
                      );

                    return {
                      providerName:
                        attempt.providerName,
                      code:
                        normalized?.code ??
                        this.fromFailoverFailureCode(
                          attempt.failureCode,
                        ),
                      message:
                        normalized?.message ??
                        'AI provider execution failed',
                    };
                  }),
            },
          });

        await this.evidence.recordFailed({
          correlationId,
          request,
          decision,
          error:
            exhausted,
          attempts,
        });

        throw exhausted;
      }

      const normalized =
        error instanceof
        AiOrchestrationError
          ? error
          : new AiOrchestrationError({
              code:
                'PROVIDER_EXECUTION_FAILED',
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown AI orchestration failure',
              retriable:
                false,
            });

      /*
       * Fatal callback results are represented as successful failover
       * termination internally. Ensure their public attempt remains
       * a failed orchestration attempt.
       */
      if (
        attempts.length > 0 &&
        normalized.details.attempt
      ) {
        const matching =
          attempts.find(
            attempt =>
              attempt.attempt ===
              normalized
                .details.attempt,
          );

        if (matching) {
          matching.status =
            'FAILED';
          matching.failureCode =
            normalized.code;
        }
      }

      await this.evidence.recordFailed({
        correlationId,
        request,
        decision,
        error:
          normalized,
        attempts,
      });

      throw normalized;
    }
  }

  private createFailoverCandidates(
    selectedProviderName:
      string,
    selectedModel:
      string | undefined,
    fallbackProviderNames:
      readonly string[],
    request:
      AiOrchestrationRequest,
  ): Array<{
    providerName: string;
    model: string;
  }> {
    return [
      selectedProviderName,
      ...fallbackProviderNames,
    ].map(
      (
        providerName,
        index,
      ) => {
        const provider =
          this.registry.get(
            providerName,
          );

        const model =
          index === 0
            ? selectedModel
            : request.model ??
              provider
                ?.getProvider()
                .defaultModel ??
              provider
                ?.manifest
                .models[0]?.id;

        if (!model?.trim()) {
          throw new AiOrchestrationError({
            code:
              'PROVIDER_EXECUTION_FAILED',
            message:
              `AI provider has no executable model: ${providerName}`,
            retriable:
              false,
            details: {
              providerName,
            },
          });
        }

        return {
          providerName,
          model:
            model.trim(),
        };
      },
    );
  }

  private toFailoverFailureCode(
    error:
      AiOrchestrationError,
  ): AiProviderFailoverFailureCode {
    switch (error.code) {
      case 'PROVIDER_TIMEOUT':
        return 'AI_PROVIDER_TIMEOUT';

      case 'PROVIDER_NOT_FOUND':
        return 'AI_PROVIDER_OUTAGE';

      case 'TOKEN_BUDGET_EXCEEDED':
        return 'AI_PROVIDER_NON_RETRYABLE_FAILURE';

      case 'PROVIDER_EXECUTION_FAILED':
        return error.retriable
          ? 'AI_PROVIDER_OUTAGE'
          : 'AI_PROVIDER_NON_RETRYABLE_FAILURE';

      case 'ALL_PROVIDERS_FAILED':
        return 'AI_PROVIDER_NON_RETRYABLE_FAILURE';
    }
  }

  private fromFailoverFailureCode(
    code:
      AiProviderFailoverFailureCode |
      undefined,
  ): AiOrchestrationFailureCode {
    switch (code) {
      case 'AI_PROVIDER_TIMEOUT':
        return 'PROVIDER_TIMEOUT';

      case 'AI_PROVIDER_RATE_LIMITED':
      case 'AI_PROVIDER_OUTAGE':
      case 'AI_PROVIDER_MALFORMED_RESPONSE':
      case 'AI_PROVIDER_UNKNOWN_FAILURE':
        return 'PROVIDER_EXECUTION_FAILED';

      case 'AI_PROVIDER_NON_RETRYABLE_FAILURE':
      default:
        return 'PROVIDER_EXECUTION_FAILED';
    }
  }

  private collectFailoverFailures(
    evidence:
      readonly AiProviderFailoverAttemptEvidence[],
  ): Map<
    number,
    AiOrchestrationError
  > {
    return new Map(
      evidence
        .filter(
          attempt =>
            attempt.outcome ===
            'FAILED',
        )
        .map(attempt => [
          attempt.globalAttemptNumber,
          new AiOrchestrationError({
            code:
              this.fromFailoverFailureCode(
                attempt.failureCode,
              ),
            message:
              'AI provider execution failed',
            retriable:
              Boolean(
                attempt.retryable,
              ),
            details: {
              providerName:
                attempt.providerName,
              attempt:
                attempt
                  .globalAttemptNumber,
            },
          }),
        ]),
    );
  }

  private toOrchestrationAttempts(
    evidence:
      readonly AiProviderFailoverAttemptEvidence[],
    failures:
      ReadonlyMap<
        number,
        AiOrchestrationError
      >,
  ): AiOrchestrationAttempt[] {
    return evidence.map(
      attempt => {
        const failure =
          failures.get(
            attempt
              .globalAttemptNumber,
          );

        const startedAtMs =
          Date.parse(
            attempt.startedAt,
          );

        const completedAtMs =
          Date.parse(
            attempt.completedAt,
          );

        return {
          providerName:
            attempt.providerName,
          attempt:
            attempt
              .globalAttemptNumber,
          status:
            failure ||
            attempt.outcome ===
              'FAILED'
              ? 'FAILED'
              : 'SUCCEEDED',
          ...(
            failure ||
            attempt.failureCode
              ? {
                  failureCode:
                    failure?.code ??
                    this
                      .fromFailoverFailureCode(
                        attempt.failureCode,
                      ),
                }
              : {}
          ),
          startedAt:
            attempt.startedAt,
          completedAt:
            attempt.completedAt,
          durationMs:
            Number.isFinite(
              startedAtMs,
            ) &&
            Number.isFinite(
              completedAtMs,
            )
              ? Math.max(
                  0,
                  completedAtMs -
                    startedAtMs,
                )
              : 0,
        };
      },
    );
  }

  private async executeProvider(
    options: {
      providerName: string;
      attempt: number;
      correlationId: string;
      startedAt: string;
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

    const context =
      this.executionContext.create({
        tenantId:
          options.request.tenantId,
        correlationId:
          options.correlationId,
        attempt:
          options.attempt,
        capability:
          options.request.capability,
        classification:
          options.request
            .dataClassification,
        executionMode:
          options.request
            .executionMode,
        timeoutMs,
        metadata: {
          ...(options.request
            .metadata ?? {}),
          providerName:
            options.providerName,
          model,
        },
        timestamps: {
          createdAt:
            options.startedAt,
          startedAt:
            options.startedAt,
        },
      });

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
          ...context.metadata,
          propertyOsTenantId:
            context.tenantId,
          propertyOsCapability:
            context.capability,
          propertyOsExecutionMode:
            context.executionMode,
          propertyOsDataClassification:
            context.classification,
          propertyOsCorrelationId:
            context.correlationId,
          propertyOsExecutionId:
            context.executionId,
          propertyOsAttempt:
            context.attempt,
          propertyOsTimeoutMs:
            context.timeoutMs,
        },
        requestId:
          context.requestId,
        preparedAt:
          context.timestamps
            .createdAt,
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
              context.correlationId,
            tenantId:
              context.tenantId,
            executionId:
              context.executionId,
            attempt:
              context.attempt,
            capability:
              context.capability,
            dataClassification:
              context.classification,
            executionMode:
              context.executionMode,
            timeoutMs:
              context.timeoutMs,
          },
        });

    const execution =
      this.executionCoordinator
        .execute({
          envelope,
          context,
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
