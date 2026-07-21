import {
  Injectable,
} from '@nestjs/common';
import {
  randomUUID,
} from 'node:crypto';
import {
  AiOrchestrationError,
} from '../errors/ai-orchestration.error';
import {
  AiOrchestratorService,
} from '../services/ai-orchestrator.service';
import {
  AiOrchestrationRequest,
} from '../types/ai-orchestration.types';
import {
  PROPERTYOS_AI_SDK_VERSION,
  PropertyOsAiFailure,
  PropertyOsAiRequest,
  PropertyOsAiResult,
} from './ai-sdk.contracts';
import {
  PropertyOsAiSdkError,
} from './propertyos-ai-sdk.error';

@Injectable()
export class PropertyOsAiSdkService {
  constructor(
    private readonly orchestrator:
      AiOrchestratorService,
  ) {}

  async execute(
    request: PropertyOsAiRequest,
  ): Promise<PropertyOsAiResult> {
    const correlationId =
      request.correlationId?.trim() ||
      randomUUID();

    try {
      this.assertRequest(
        request,
        correlationId,
      );

      const result =
        await this.orchestrator.execute(
          this.toOrchestrationRequest(
            request,
            correlationId,
          ),
        );

      return {
        ok: true,
        sdkVersion:
          PROPERTYOS_AI_SDK_VERSION,
        correlationId:
          result.correlationId,
        content:
          result.response.content,
        providerName:
          result.response.providerName,
        model:
          result.response.model,
        usage:
          result.response.usage,
        raw:
          result.response.raw,
        attempts:
          result.attempts.map(
            attempt => ({
              ...attempt,
            }),
          ),
      };
    } catch (error) {
      return this.toFailure(
        error,
        correlationId,
      );
    }
  }

  async executeOrThrow(
    request: PropertyOsAiRequest,
  ) {
    const result =
      await this.execute(request);

    if (result.ok === false) {
      throw new PropertyOsAiSdkError(
        result.error.code,
        result.error.message,
        result.error.retriable,
        result.correlationId,
        result.error.details,
      );
    }

    return result;
  }

  private assertRequest(
    request: PropertyOsAiRequest,
    correlationId: string,
  ): void {
    if (!request.tenantId?.trim()) {
      throw new PropertyOsAiSdkError(
        'INVALID_SDK_REQUEST',
        'tenantId is required',
        false,
        correlationId,
      );
    }

    if (!request.moduleId?.trim()) {
      throw new PropertyOsAiSdkError(
        'INVALID_SDK_REQUEST',
        'moduleId is required',
        false,
        correlationId,
      );
    }

    if (!request.messages?.length) {
      throw new PropertyOsAiSdkError(
        'INVALID_SDK_REQUEST',
        'At least one AI message is required',
        false,
        correlationId,
      );
    }
  }

  private toOrchestrationRequest(
    request: PropertyOsAiRequest,
    correlationId: string,
  ): AiOrchestrationRequest {
    return {
      tenantId:
        request.tenantId,
      capability:
        request.capability,
      executionMode:
        request.executionMode ??
        'SIMULATED',
      dataClassification:
        request.dataClassification ??
        'INTERNAL',
      messages:
        request.messages.map(
          message => ({
            ...message,
          }),
        ),
      providerName:
        request.providerName,
      model:
        request.model,
      temperature:
        request.temperature,
      maxTokens:
        request.maxTokens,
      tokenBudget:
        request.tokenBudget
          ? {
              ...request.tokenBudget,
            }
          : undefined,
      costBudget:
        request.costBudget
          ? {
              ...request.costBudget,
            }
          : undefined,
      fallbackProviderNames:
        request.fallbackProviderNames
          ? [
              ...request
                .fallbackProviderNames,
            ]
          : undefined,
      humanApprovalReference:
        request
          .humanApprovalReference,
      timeoutMs:
        request.timeoutMs,
      correlationId,
      metadata: {
        ...(request.metadata ?? {}),
        propertyOsAiSdkVersion:
          PROPERTYOS_AI_SDK_VERSION,
        propertyOsModuleId:
          request.moduleId,
      },
    };
  }

  private toFailure(
    error: unknown,
    correlationId: string,
  ): PropertyOsAiFailure {
    if (
      error instanceof
      PropertyOsAiSdkError
    ) {
      return {
        ok: false,
        sdkVersion:
          PROPERTYOS_AI_SDK_VERSION,
        correlationId:
          error.correlationId,
        error: {
          code:
            error.code,
          message:
            error.message,
          retriable:
            error.retriable,
          details:
            error.details,
        },
      };
    }

    if (
      error instanceof
      AiOrchestrationError
    ) {
      return {
        ok: false,
        sdkVersion:
          PROPERTYOS_AI_SDK_VERSION,
        correlationId,
        error: {
          code:
            error.code,
          message:
            error.message,
          retriable:
            error.retriable,
          details:
            error.details as
              Record<string, unknown>,
        },
      };
    }

    return {
      ok: false,
      sdkVersion:
        PROPERTYOS_AI_SDK_VERSION,
      correlationId,
      error: {
        code:
          'AI_SDK_EXECUTION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown PropertyOS AI SDK failure',
        retriable:
          false,
      },
    };
  }
}
