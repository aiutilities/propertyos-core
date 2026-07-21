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
import { AiRoutingPolicyService } from './ai-routing-policy.service';

@Injectable()
export class AiOrchestratorService {
  private readonly defaultTimeoutMs = 30_000;

  constructor(
    private readonly routingPolicy: AiRoutingPolicyService,
    private readonly registry: AiProviderRegistry,
  ) {}

  async execute(
    request: AiOrchestrationRequest,
  ): Promise<AiOrchestrationResult> {
    const decision = this.routingPolicy.decide(request);
    const providerNames = [
      decision.providerName,
      ...decision.fallbackProviderNames,
    ];
    const attempts: AiOrchestrationAttempt[] = [];
    const failures: Array<{
      providerName: string;
      code: AiOrchestrationFailureCode;
      message: string;
    }> = [];

    for (const [index, providerName] of providerNames.entries()) {
      const attempt = index + 1;

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

        attempts.push({
          providerName,
          attempt,
          status: 'SUCCEEDED',
        });

        return {
          response,
          decision: {
            ...decision,
            providerName,
            model: response.model,
          },
          attempts,
        };
      } catch (error) {
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
