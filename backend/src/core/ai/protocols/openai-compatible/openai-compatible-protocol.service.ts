import {
  Injectable,
} from '@nestjs/common';
import {
  OpenAiCompatibleProtocolError,
} from '../../errors/openai-compatible-protocol.error';
import {
  AiProviderRuntimeService,
} from '../../runtime/ai-provider-runtime.service';
import {
  AiRequest,
  AiResponse,
} from '../../types/ai.types';
import {
  OpenAiCompatibleChatCompletionRequest,
  OpenAiCompatibleChatCompletionResponse,
  OpenAiCompatibleExecutionOptions,
  OpenAiCompatibleProtocolResult,
} from '../../types/openai-compatible-protocol.types';

@Injectable()
export class OpenAiCompatibleProtocolService {
  private readonly defaultPath =
    '/chat/completions';

  constructor(
    private readonly runtime:
      AiProviderRuntimeService,
  ) {}

  mapRequest(options: {
    providerName: string;
    defaultModel?: string;
    request: AiRequest;
  }): OpenAiCompatibleChatCompletionRequest {
    const providerName =
      this.normalizeProviderName(
        options.providerName,
      );

    const model =
      options.request
        .model
        ?.trim() ||
      options.defaultModel
        ?.trim();

    if (!model) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'MODEL_REQUIRED',
        message:
          `OpenAI-compatible request requires a model: ` +
          `${providerName}`,
      });
    }

    if (
      !Array.isArray(
        options.request.messages,
      ) ||
      options.request
        .messages
        .length === 0
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'MESSAGES_REQUIRED',
        message:
          `OpenAI-compatible request requires at least one message: ` +
          `${providerName}`,
      });
    }

    const messages =
      options.request
        .messages
        .map(
          (
            message,
            index,
          ) => {
            const content =
              message.content
                ?.trim();

            if (
              !content ||
              ![
                'system',
                'user',
                'assistant',
                'tool',
              ].includes(
                message.role,
              )
            ) {
              throw new OpenAiCompatibleProtocolError({
                providerName,
                code:
                  'INVALID_MESSAGE',
                message:
                  `Invalid OpenAI-compatible message at index ` +
                  `${index}: ${providerName}`,
              });
            }

            return {
              role:
                message.role,
              content,
            };
          },
        );

    const temperature =
      options.request
        .temperature;

    if (
      temperature !==
        undefined &&
      (
        typeof temperature !==
          'number' ||
        !Number.isFinite(
          temperature,
        ) ||
        temperature < 0 ||
        temperature > 2
      )
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_TEMPERATURE',
        message:
          `OpenAI-compatible temperature must be between 0 and 2: ` +
          `${providerName}`,
      });
    }

    const maxTokens =
      options.request
        .maxTokens;

    if (
      maxTokens !==
        undefined &&
      (
        !Number.isInteger(
          maxTokens,
        ) ||
        maxTokens <= 0
      )
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_MAX_TOKENS',
        message:
          `OpenAI-compatible maxTokens must be a positive integer: ` +
          `${providerName}`,
      });
    }

    return {
      model,
      messages,
      temperature,
      max_tokens:
        maxTokens,
      stream:
        false,
    };
  }

  mapResponse(options: {
    providerName: string;
    requestedModel: string;
    raw: unknown;
  }): AiResponse {
    const providerName =
      this.normalizeProviderName(
        options.providerName,
      );

    if (
      !this.isRecord(
        options.raw,
      )
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `OpenAI-compatible response must be an object: ` +
          `${providerName}`,
      });
    }

    const raw =
      options.raw as
        OpenAiCompatibleChatCompletionResponse;

    if (
      !Array.isArray(
        raw.choices,
      ) ||
      raw.choices.length ===
        0
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `OpenAI-compatible response contains no choices: ` +
          `${providerName}`,
      });
    }

    const message =
      raw.choices[0]
        ?.message;

    if (
      !message ||
      !this.isRecord(
        message,
      )
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `OpenAI-compatible response message is invalid: ` +
          `${providerName}`,
      });
    }

    const content =
      message.content;

    if (
      content !==
        undefined &&
      content !==
        null &&
      typeof content !==
        'string'
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `OpenAI-compatible response content is invalid: ` +
          `${providerName}`,
      });
    }

    const normalizedContent =
      typeof content ===
        'string'
        ? content.trim()
        : '';

    const toolCalls =
      message.tool_calls;

    if (
      toolCalls !==
        undefined &&
      toolCalls !==
        null &&
      !Array.isArray(
        toolCalls,
      )
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `OpenAI-compatible response tool_calls are invalid: ` +
          `${providerName}`,
      });
    }

    const hasToolCalls =
      Array.isArray(
        toolCalls,
      ) &&
      toolCalls.length >
        0;

    if (
      !normalizedContent &&
      !hasToolCalls
    ) {
      throw new OpenAiCompatibleProtocolError({
        providerName,
        code:
          'EMPTY_RESPONSE_CONTENT',
        message:
          `OpenAI-compatible response contains no text or tool calls: ` +
          `${providerName}`,
      });
    }

    const usage =
      this.mapUsage(
        raw.usage,
      );

    return {
      providerName,
      model:
        typeof raw.model ===
          'string' &&
        raw.model.trim()
          ? raw.model.trim()
          : options
              .requestedModel,
      content:
        normalizedContent,
      raw,
      usage,
    };
  }

  async execute(
    options:
      OpenAiCompatibleExecutionOptions,
  ): Promise<
    OpenAiCompatibleProtocolResult
  > {
    const providerName =
      this.normalizeProviderName(
        options.configuration
          .providerName,
      );

    const mappedRequest =
      this.mapRequest({
        providerName,
        defaultModel:
          options.configuration
            .defaultModel,
        request:
          options.request,
      });

    const execution =
      await this.runtime
        .execute<
          OpenAiCompatibleChatCompletionResponse
        >({
          configuration:
            options.configuration,
          path:
            options.path ??
            this.defaultPath,
          method:
            'POST',
          headers: {
            accept:
              'application/json',
            ...options.headers,
          },
          body:
            mappedRequest,
          createCredentialHeaders:
            (credential) => ({
              authorization:
                `Bearer ${credential}`,
            }),
        });

    const response =
      this.mapResponse({
        providerName:
          execution.providerName,
        requestedModel:
          mappedRequest.model,
        raw:
          execution.response
            .data,
      });

    return {
      request:
        mappedRequest,
      response,
      raw:
        execution.response
          .data,
    };
  }

  private mapUsage(
    usage:
      OpenAiCompatibleChatCompletionResponse[
        'usage'
      ],
  ):
    | AiResponse['usage']
    | undefined {
    if (
      !usage ||
      !this.isRecord(
        usage,
      )
    ) {
      return undefined;
    }

    const inputTokens =
      this.optionalNonNegativeInteger(
        usage.prompt_tokens,
      );

    const outputTokens =
      this.optionalNonNegativeInteger(
        usage.completion_tokens,
      );

    const totalTokens =
      this.optionalNonNegativeInteger(
        usage.total_tokens,
      );

    if (
      inputTokens ===
        undefined &&
      outputTokens ===
        undefined &&
      totalTokens ===
        undefined
    ) {
      return undefined;
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens,
    };
  }

  private optionalNonNegativeInteger(
    value: unknown,
  ): number | undefined {
    return (
      Number.isInteger(
        value,
      ) &&
      Number(value) >= 0
    )
      ? Number(value)
      : undefined;
  }

  private normalizeProviderName(
    providerName: string,
  ): string {
    return (
      providerName
        .trim()
        .toLowerCase() ||
      'unknown'
    );
  }

  private isRecord(
    value: unknown,
  ): value is
    Record<string, unknown> {
    return Boolean(
      value &&
      typeof value ===
        'object' &&
      !Array.isArray(
        value,
      ),
    );
  }
}
