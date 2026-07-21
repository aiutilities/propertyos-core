import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  AiOrchestrationError,
  AiOrchestrationFailureCode,
} from '../errors/ai-orchestration.error';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import {
  AiOrchestrationAttempt,
  AiOrchestrationRequest,
  AiOrchestrationResult,
} from '../types/ai-orchestration.types';
import { AiResponse } from '../types/ai.types';
import { AiOrchestrationEvidenceService } from './ai-orchestration-evidence.service';
import { AiRoutingPolicyService } from './ai-routing-policy.service';

@Injectable()
export class AiOrchestratorService {
  private readonly defaultTimeoutMs = 30_000;

  constructor(
    private readonly routingPolicy: AiRoutingPolicyService,
    private readonly registry: AiProviderRegistry,
    private readonly evidence: AiOrchestrationEvidenceService,
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

  private async executeProvider(options: {
    providerName: string;
    attempt: number;
    request: AiOrchestrationRequest;
    selectedModel?: string;
  }): Promise<AiResponse> {
    const provider = this.registry.get(options.providerName);

    if (!provider) {
      throw new AiOrchestrationError({
        code: 'PROVIDER_NOT_FOUND',
        message: `AI provider not found: ${options.providerName}`,
        retriable: true,
        details: {
          providerName: options.providerName,
          attempt: options.attempt,
        },
      });
    }

    const timeoutMs = options.request.timeoutMs ?? this.defaultTimeoutMs;

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new AiOrchestrationError({
        code: 'PROVIDER_EXECUTION_FAILED',
        message: 'AI provider timeout must be a positive integer',
        retriable: false,
        details: {
          providerName: options.providerName,
          attempt: options.attempt,
          timeoutMs,
        },
      });
    }

    return this.withTimeout(
      provider.generate({
        ...options.request,
        providerName: options.providerName,
        model: options.selectedModel,
      }),
      timeoutMs,
      options.providerName,
      options.attempt,
    );
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
