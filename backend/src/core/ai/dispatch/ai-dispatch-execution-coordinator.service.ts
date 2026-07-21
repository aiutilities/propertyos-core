import {
  Injectable,
} from '@nestjs/common';

import {
  AiDispatchExecutionError,
} from '../errors/ai-dispatch-execution.error';

import {
  AiProviderRegistry,
} from '../registry/ai-provider.registry';

import {
  AiDispatchExecutionEvidence,
  AiDispatchExecutionInput,
  AiDispatchExecutionResult,
} from '../types/ai-dispatch-execution.types';

import {
  AiPreparedRequestDispatchEnvelope,
} from '../types/ai-prepared-request-dispatch.types';

import {
  AiRequest,
} from '../types/ai.types';

@Injectable()
export class AiDispatchExecutionCoordinatorService {
  constructor(
    private readonly registry:
      AiProviderRegistry,
  ) {}

  async execute(
    input: AiDispatchExecutionInput,
  ): Promise<AiDispatchExecutionResult> {
    if (
      !input ||
      typeof input !== 'object'
    ) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_INPUT_REQUIRED',
        'Dispatch execution input is required',
      );
    }

    const envelope =
      this.validateEnvelope(
        input.envelope,
      );

    const executionId =
      this.resolveExecutionId(
        input.executionId,
        envelope,
      );

    const startedAt =
      this.resolveTimestamp(
        input.startedAt,
        'startedAt',
      );

    const provider =
      this.registry.get(
        envelope.provider,
      );

    if (!provider) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_PROVIDER_NOT_FOUND',
        `AI provider not found for dispatch execution: ${envelope.provider}`,
        {
          executionId,
          dispatchId:
            envelope.dispatchId,
          requestId:
            envelope.requestId,
          provider:
            envelope.provider,
          model:
            envelope.model,
        },
      );
    }

    const registeredName =
      provider.name
        .trim()
        .toLowerCase();

    if (
      registeredName !==
      envelope.provider
        .trim()
        .toLowerCase()
    ) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_PROVIDER_MISMATCH',
        `Resolved provider ${provider.name} does not match dispatch provider ${envelope.provider}`,
        {
          executionId,
          dispatchId:
            envelope.dispatchId,
          requestId:
            envelope.requestId,
          provider:
            envelope.provider,
          model:
            envelope.model,
        },
      );
    }

    const providerDescriptor =
      provider.getProvider();

    const availableModels =
      provider.manifest.models.map(
        model =>
          model.id.trim(),
      );

    if (
      availableModels.length > 0 &&
      !availableModels.includes(
        envelope.model,
      )
    ) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_MODEL_MISMATCH',
        `Dispatch model ${envelope.model} is not declared by provider ${envelope.provider}`,
        {
          executionId,
          dispatchId:
            envelope.dispatchId,
          requestId:
            envelope.requestId,
          provider:
            envelope.provider,
          model:
            envelope.model,
        },
      );
    }

    const request =
      this.toProviderRequest(
        envelope,
      );

    try {
      const response =
        await provider.generate(
          request,
        );

      const completedAt =
        new Date()
          .toISOString();

      const metadata =
        input.metadata === undefined
          ? undefined
          : this.deepFreeze(
              this.deepClone(
                input.metadata,
              ),
            );

      const evidence =
        this.createEvidence({
          executionId,
          envelope,
          outcome:
            'SUCCEEDED',
          startedAt,
          completedAt,
          providerResolved:
            true,
          providerInvoked:
            true,
        });

      return Object.freeze({
        executionId,
        dispatchId:
          envelope.dispatchId,
        requestId:
          envelope.requestId,
        provider:
          envelope.provider,
        model:
          response.model ||
          providerDescriptor
            .defaultModel ||
          envelope.model,
        response,
        ...(metadata === undefined
          ? {}
          : {
              metadata,
            }),
        evidence,
      });
    } catch (error) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_PROVIDER_FAILED',
        `AI provider execution failed for dispatch ${envelope.dispatchId}`,
        {
          executionId,
          dispatchId:
            envelope.dispatchId,
          requestId:
            envelope.requestId,
          provider:
            envelope.provider,
          model:
            envelope.model,
          causeName:
            error instanceof Error
              ? error.name
              : typeof error,
          causeMessage:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
    }
  }

  private validateEnvelope(
    envelope:
      | AiPreparedRequestDispatchEnvelope
      | undefined,
  ): AiPreparedRequestDispatchEnvelope {
    if (
      !envelope ||
      typeof envelope !== 'object' ||
      !envelope.dispatchId ||
      !envelope.requestId ||
      !envelope.provider ||
      !envelope.runtimeProvider ||
      !envelope.protocol ||
      !envelope.model ||
      !envelope.request ||
      envelope.request.requestId !==
        envelope.requestId ||
      envelope.request.provider !==
        envelope.provider ||
      envelope.request.model !==
        envelope.model
    ) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_ENVELOPE_REQUIRED',
        'A structurally valid dispatch envelope is required',
      );
    }

    return envelope;
  }

  private toProviderRequest(
    envelope:
      AiPreparedRequestDispatchEnvelope,
  ): AiRequest {
    const prepared =
      envelope.request;

    /*
     * AiRequest remains the existing common provider
     * contract. This bridge intentionally performs only
     * structural translation from the immutable prepared
     * request and does not invoke protocols or runtime
     * infrastructure directly.
     */
    return {
      providerName:
        envelope.provider,
      model:
        envelope.model,
      messages:
        prepared.messages.map(
          message => ({
            role:
              message.role,
            content:
              message.content,
            ...(message.name === undefined
              ? {}
              : {
                  name:
                    message.name,
                }),
            ...(message.metadata ===
            undefined
              ? {}
              : {
                  metadata:
                    this.deepClone(
                      message.metadata,
                    ),
                }),
          }),
        ),
      ...(prepared.systemPrompt ===
      undefined
        ? {}
        : {
            systemPrompt:
              prepared.systemPrompt,
          }),
      temperature:
        prepared.temperature,
      topP:
        prepared.topP,
      maxTokens:
        prepared.maxOutputTokens,
      stopSequences: [
        ...prepared.stopSequences,
      ],
      metadata: {
        ...(prepared.metadata
          ? this.deepClone(
              prepared.metadata,
            )
          : {}),
        propertyOsRequestId:
          prepared.requestId,
        propertyOsDispatchId:
          envelope.dispatchId,
        propertyOsRuntimeProvider:
          envelope.runtimeProvider,
        propertyOsProtocol:
          envelope.protocol,
      },
    } as unknown as AiRequest;
  }

  private createEvidence(
    input: {
      executionId: string;
      envelope:
        AiPreparedRequestDispatchEnvelope;
      outcome:
        'SUCCEEDED' | 'FAILED';
      startedAt: string;
      completedAt: string;
      providerResolved: boolean;
      providerInvoked: boolean;
    },
  ): AiDispatchExecutionEvidence {
    const started =
      Date.parse(
        input.startedAt,
      );

    const completed =
      Date.parse(
        input.completedAt,
      );

    return Object.freeze({
      executionId:
        input.executionId,
      dispatchId:
        input.envelope
          .dispatchId,
      requestId:
        input.envelope
          .requestId,
      provider:
        input.envelope
          .provider,
      runtimeProvider:
        input.envelope
          .runtimeProvider,
      protocol:
        input.envelope
          .protocol,
      model:
        input.envelope
          .model,
      messageCount:
        input.envelope
          .request
          .messages
          .length,
      outcome:
        input.outcome,
      startedAt:
        input.startedAt,
      completedAt:
        input.completedAt,
      durationMs:
        Math.max(
          0,
          completed -
            started,
        ),
      providerResolved:
        input.providerResolved,
      providerInvoked:
        input.providerInvoked,
      validations:
        Object.freeze([
          'envelope:valid',
          'provider:resolved',
          'provider:matched',
          'model:declared',
          'request:translated',
          'provider:invoked',
        ]),
    });
  }

  private resolveTimestamp(
    value:
      | string
      | undefined,
    field: string,
  ): string {
    if (
      value === undefined
    ) {
      return new Date()
        .toISOString();
    }

    const parsed =
      Date.parse(value);

    if (
      Number.isNaN(parsed)
    ) {
      throw new AiDispatchExecutionError(
        'AI_DISPATCH_EXECUTION_INVALID_TIMESTAMP',
        `${field} must be a valid timestamp`,
      );
    }

    return new Date(
      parsed,
    ).toISOString();
  }

  private resolveExecutionId(
    supplied:
      | string
      | undefined,
    envelope:
      AiPreparedRequestDispatchEnvelope,
  ): string {
    if (
      supplied !== undefined
    ) {
      const normalized =
        supplied.trim();

      if (!normalized) {
        throw new AiDispatchExecutionError(
          'AI_DISPATCH_EXECUTION_INVALID_ID',
          'executionId must not be empty',
        );
      }

      return normalized;
    }

    const material =
      [
        envelope.dispatchId,
        envelope.requestId,
        envelope.provider,
        envelope.runtimeProvider,
        envelope.protocol,
        envelope.model,
      ].join('|');

    return `aiex_${this.hash(
      material,
    )}`;
  }

  private hash(
    value: string,
  ): string {
    let hash =
      2166136261;

    for (
      let index = 0;
      index < value.length;
      index += 1
    ) {
      hash ^=
        value.charCodeAt(
          index,
        );

      hash =
        Math.imul(
          hash,
          16777619,
        ) >>> 0;
    }

    return hash
      .toString(16)
      .padStart(
        8,
        '0',
      );
  }

  private deepClone<T>(
    value: T,
  ): T {
    if (
      value === null ||
      typeof value !== 'object'
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value.map(
        item =>
          this.deepClone(
            item,
          ),
      ) as T;
    }

    const clone:
      Record<string, unknown> =
      {};

    for (
      const [
        key,
        item,
      ] of Object.entries(
        value as Record<
          string,
          unknown
        >,
      )
    ) {
      clone[key] =
        this.deepClone(
          item,
        );
    }

    return clone as T;
  }

  private deepFreeze<T>(
    value: T,
  ): T {
    if (
      value === null ||
      typeof value !==
        'object' ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.values(
      value as Record<
        string,
        unknown
      >,
    ).forEach(
      item =>
        this.deepFreeze(
          item,
        ),
    );

    return Object.freeze(
      value,
    );
  }
}
