import {
  Injectable,
} from '@nestjs/common';
import {
  AnthropicMessagesProtocolError,
} from '../../errors/anthropic-messages-protocol.error';
import {
  AiProviderRuntimeService,
} from '../../runtime/ai-provider-runtime.service';
import {
  AiRequest,
  AiResponse,
} from '../../types/ai.types';
import {
  AnthropicMessagesExecutionOptions,
  AnthropicMessagesInputMessage,
  AnthropicMessagesProtocolResult,
  AnthropicMessagesRequest,
  AnthropicMessagesResponse,
} from '../../types/anthropic-messages-protocol.types';

@Injectable()
export class AnthropicMessagesProtocolService {
  private readonly defaultPath =
    '/v1/messages';

  private readonly defaultVersion =
    '2023-06-01';

  private readonly defaultMaxTokens =
    4_096;

  constructor(
    private readonly runtime:
      AiProviderRuntimeService,
  ) {}

  mapRequest(options: {
    providerName: string;
    defaultModel?: string;
    defaultMaxTokens?: number;
    request: AiRequest;
  }): AnthropicMessagesRequest {
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
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'MODEL_REQUIRED',
        message:
          `Anthropic Messages request requires a model: ` +
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
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'MESSAGES_REQUIRED',
        message:
          `Anthropic Messages request requires at least one message: ` +
          `${providerName}`,
      });
    }

    const systemParts:
      string[] = [];

    const messages:
      AnthropicMessagesInputMessage[] =
      [];

    options.request
      .messages
      .forEach(
        (
          message,
          index,
        ) => {
          const content =
            message.content
              ?.trim();

          if (!content) {
            throw new AnthropicMessagesProtocolError({
              providerName,
              code:
                'INVALID_MESSAGE',
              message:
                `Anthropic message content is invalid at index ` +
                `${index}: ${providerName}`,
            });
          }

          if (
            message.role ===
              'system'
          ) {
            systemParts.push(
              content,
            );

            return;
          }

          if (
            message.role ===
              'tool'
          ) {
            throw new AnthropicMessagesProtocolError({
              providerName,
              code:
                'UNSUPPORTED_MESSAGE_ROLE',
              message:
                `Anthropic tool messages are not supported yet at index ` +
                `${index}: ${providerName}`,
            });
          }

          if (
            message.role !==
              'user' &&
            message.role !==
              'assistant'
          ) {
            throw new AnthropicMessagesProtocolError({
              providerName,
              code:
                'UNSUPPORTED_MESSAGE_ROLE',
              message:
                `Anthropic message role is unsupported at index ` +
                `${index}: ${providerName}`,
            });
          }

          messages.push({
            role:
              message.role,
            content,
          });
        },
      );

    if (
      messages.length ===
        0
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'CONVERSATION_REQUIRED',
        message:
          `Anthropic Messages request requires a user or assistant message: ` +
          `${providerName}`,
      });
    }

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
        temperature > 1
      )
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'INVALID_TEMPERATURE',
        message:
          `Anthropic temperature must be between 0 and 1: ` +
          `${providerName}`,
      });
    }

    const maxTokens =
      options.request
        .maxTokens ??
      options.defaultMaxTokens ??
      this.defaultMaxTokens;

    if (
      !Number.isInteger(
        maxTokens,
      ) ||
      maxTokens <= 0
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'INVALID_MAX_TOKENS',
        message:
          `Anthropic maxTokens must be a positive integer: ` +
          `${providerName}`,
      });
    }

    return {
      model,
      messages,
      system:
        systemParts.length > 0
          ? systemParts.join(
              '\n\n',
            )
          : undefined,
      max_tokens:
        maxTokens,
      temperature,
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
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `Anthropic Messages response must be an object: ` +
          `${providerName}`,
      });
    }

    const raw =
      options.raw as
        AnthropicMessagesResponse;

    if (
      !Array.isArray(
        raw.content,
      ) ||
      raw.content.length ===
        0
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'INVALID_RESPONSE',
        message:
          `Anthropic Messages response contains no content blocks: ` +
          `${providerName}`,
      });
    }

    const text =
      raw.content
        .filter(
          (block) =>
            this.isRecord(
              block,
            ) &&
            block.type ===
              'text' &&
            typeof block.text ===
              'string',
        )
        .map(
          (block) =>
            String(
              block.text,
            ).trim(),
        )
        .filter(
          Boolean,
        )
        .join(
          '\n',
        );

    const hasToolUse =
      raw.content
        .some(
          (block) =>
            this.isRecord(
              block,
            ) &&
            block.type ===
              'tool_use',
        );

    if (
      !text &&
      !hasToolUse
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'EMPTY_RESPONSE_CONTENT',
        message:
          `Anthropic Messages response contains no non-empty text or tool-use blocks: ` +
          `${providerName}`,
      });
    }

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
        text,
      raw,
      usage:
        this.mapUsage(
          raw.usage,
        ),
    };
  }

  async execute(
    options:
      AnthropicMessagesExecutionOptions,
  ): Promise<
    AnthropicMessagesProtocolResult
  > {
    const providerName =
      this.normalizeProviderName(
        options.configuration
          .providerName,
      );

    const anthropicVersion =
      options.anthropicVersion
        ?.trim() ||
      this.defaultVersion;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        anthropicVersion,
      )
    ) {
      throw new AnthropicMessagesProtocolError({
        providerName,
        code:
          'INVALID_ANTHROPIC_VERSION',
        message:
          `Anthropic version must use YYYY-MM-DD format: ` +
          `${providerName}`,
      });
    }

    const mappedRequest =
      this.mapRequest({
        providerName,
        defaultModel:
          options.configuration
            .defaultModel,
        defaultMaxTokens:
          options.defaultMaxTokens,
        request:
          options.request,
      });

    const execution =
      await this.runtime
        .execute<
          AnthropicMessagesResponse
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
            'anthropic-version':
              anthropicVersion,
            ...options.headers,
          },
          body:
            mappedRequest,
          createCredentialHeaders:
            (credential) => ({
              'x-api-key':
                credential,
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
      AnthropicMessagesResponse[
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
        usage.input_tokens,
      );

    const outputTokens =
      this.optionalNonNegativeInteger(
        usage.output_tokens,
      );

    if (
      inputTokens ===
        undefined &&
      outputTokens ===
        undefined
    ) {
      return undefined;
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens:
        inputTokens !==
          undefined &&
        outputTokens !==
          undefined
          ? inputTokens +
            outputTokens
          : undefined,
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
