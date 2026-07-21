import {
  Injectable,
} from '@nestjs/common';

import {
  AiRequestPreparationError,
} from '../errors/ai-request-preparation.error';

import {
  AiPreparedMessage,
  AiPreparedMessageRole,
  AiPreparedProviderRequest,
  AiRequestGenerationDefaults,
  AiRequestPreparationEvidence,
  AiRequestPreparationInput,
} from '../types/ai-request-preparation.types';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TOP_P = 1;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const MAX_OUTPUT_TOKENS = 1_000_000;

const SUPPORTED_ROLES =
  new Set<AiPreparedMessageRole>([
    'SYSTEM',
    'USER',
    'ASSISTANT',
    'TOOL',
  ]);

@Injectable()
export class AiRequestPreparationService {
  prepare(
    input: AiRequestPreparationInput,
  ): AiPreparedProviderRequest {
    const normalizations: string[] = [];

    const provider =
      this.normalizeRequiredIdentifier(
        input.provider,
        'provider',
        normalizations,
      );

    const model =
      this.normalizeRequiredIdentifier(
        input.model,
        'model',
        normalizations,
      );

    const messages =
      this.prepareMessages(
        input.messages,
        normalizations,
      );

    const systemPrompt =
      this.prepareSystemPrompt(
        input.systemPrompt,
        normalizations,
      );

    const temperature =
      this.resolveTemperature(
        input.generation?.temperature,
        input.defaults,
      );

    const topP =
      this.resolveTopP(
        input.generation?.topP,
        input.defaults,
      );

    const maxOutputTokens =
      this.resolveMaxOutputTokens(
        input.generation?.maxOutputTokens,
        input.defaults,
      );

    const stopSequences =
      this.prepareStopSequences(
        input.generation?.stopSequences,
        normalizations,
      );

    const metadata =
      input.metadata === undefined
        ? undefined
        : this.deepFreeze(
            this.deepClone(
              input.metadata,
            ),
          );

    const preparedAt =
      this.resolvePreparedAt(
        input.preparedAt,
      );

    const requestId =
      this.resolveRequestId(
        input.requestId,
        {
          provider,
          model,
          messages,
          systemPrompt,
          temperature,
          topP,
          maxOutputTokens,
          stopSequences,
          metadata,
        },
        normalizations,
      );

    const frozenNormalizations =
      Object.freeze([
        ...normalizations,
      ]);

    const evidence:
      AiRequestPreparationEvidence =
      Object.freeze({
        requestId,
        provider,
        model,
        messageCount:
          messages.length,
        systemPromptPresent:
          systemPrompt !== undefined,
        temperature,
        topP,
        maxOutputTokens,
        stopSequenceCount:
          stopSequences.length,
        preparedAt,
        normalizations:
          frozenNormalizations,
      });

    return Object.freeze({
      requestId,
      provider,
      model,
      messages,
      ...(systemPrompt === undefined
        ? {}
        : {
            systemPrompt,
          }),
      temperature,
      topP,
      maxOutputTokens,
      stopSequences,
      ...(metadata === undefined
        ? {}
        : {
            metadata,
          }),
      evidence,
    });
  }

  private normalizeRequiredIdentifier(
    value: string,
    field: 'provider' | 'model',
    normalizations: string[],
  ): string {
    const normalized =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (!normalized) {
      throw new AiRequestPreparationError(
        field === 'provider'
          ? 'AI_REQUEST_PROVIDER_REQUIRED'
          : 'AI_REQUEST_MODEL_REQUIRED',
        `${field} is required`,
      );
    }

    if (normalized !== value) {
      normalizations.push(
        `${field}:trimmed`,
      );
    }

    return normalized;
  }

  private prepareMessages(
    messages:
      | readonly {
          role: string;
          content: string;
          name?: string;
          metadata?: Readonly<
            Record<string, unknown>
          >;
        }[]
      | undefined,
    normalizations: string[],
  ): readonly AiPreparedMessage[] {
    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_MESSAGES_REQUIRED',
        'At least one message is required',
      );
    }

    const prepared =
      messages.map(
        (
          message,
          index,
        ): AiPreparedMessage => {
          if (
            !message ||
            typeof message.role !==
              'string' ||
            typeof message.content !==
              'string'
          ) {
            throw new AiRequestPreparationError(
              'AI_REQUEST_INVALID_MESSAGE',
              `Message ${index} is invalid`,
            );
          }

          const role =
            message.role
              .trim()
              .toUpperCase() as
              AiPreparedMessageRole;

          if (
            !SUPPORTED_ROLES.has(
              role,
            )
          ) {
            throw new AiRequestPreparationError(
              'AI_REQUEST_INVALID_MESSAGE',
              `Message ${index} has an unsupported role`,
            );
          }

          if (
            message.content.trim()
              .length === 0
          ) {
            throw new AiRequestPreparationError(
              'AI_REQUEST_INVALID_MESSAGE',
              `Message ${index} has empty content`,
            );
          }

          if (
            role !== message.role
          ) {
            normalizations.push(
              `messages[${index}].role:normalized`,
            );
          }

          const name =
            message.name === undefined
              ? undefined
              : message.name.trim();

          if (
            message.name !== undefined &&
            !name
          ) {
            throw new AiRequestPreparationError(
              'AI_REQUEST_INVALID_MESSAGE',
              `Message ${index} has an empty name`,
            );
          }

          if (
            message.name !== undefined &&
            name !== message.name
          ) {
            normalizations.push(
              `messages[${index}].name:trimmed`,
            );
          }

          const metadata =
            message.metadata ===
            undefined
              ? undefined
              : this.deepFreeze(
                  this.deepClone(
                    message.metadata,
                  ),
                );

          return Object.freeze({
            role,
            content:
              message.content,
            ...(name === undefined
              ? {}
              : {
                  name,
                }),
            ...(metadata ===
            undefined
              ? {}
              : {
                  metadata,
                }),
          });
        },
      );

    return Object.freeze(
      prepared,
    );
  }

  private prepareSystemPrompt(
    systemPrompt:
      | string
      | undefined,
    normalizations: string[],
  ): string | undefined {
    if (
      systemPrompt === undefined
    ) {
      return undefined;
    }

    if (
      typeof systemPrompt !==
      'string' ||
      systemPrompt.trim()
        .length === 0
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_MESSAGE',
        'System prompt must contain text',
      );
    }

    const normalized =
      systemPrompt.trim();

    if (
      normalized !== systemPrompt
    ) {
      normalizations.push(
        'systemPrompt:trimmed',
      );
    }

    return normalized;
  }

  private resolveTemperature(
    requested:
      | number
      | undefined,
    defaults:
      | AiRequestGenerationDefaults
      | undefined,
  ): number {
    const value =
      requested ??
      defaults?.temperature ??
      DEFAULT_TEMPERATURE;

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 2
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_TEMPERATURE',
        'temperature must be between 0 and 2',
      );
    }

    return value;
  }

  private resolveTopP(
    requested:
      | number
      | undefined,
    defaults:
      | AiRequestGenerationDefaults
      | undefined,
  ): number {
    const value =
      requested ??
      defaults?.topP ??
      DEFAULT_TOP_P;

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 1
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_TOP_P',
        'topP must be greater than 0 and at most 1',
      );
    }

    return value;
  }

  private resolveMaxOutputTokens(
    requested:
      | number
      | undefined,
    defaults:
      | AiRequestGenerationDefaults
      | undefined,
  ): number {
    const value =
      requested ??
      defaults?.maxOutputTokens ??
      DEFAULT_MAX_OUTPUT_TOKENS;

    if (
      !Number.isInteger(value) ||
      value <= 0 ||
      value >
        MAX_OUTPUT_TOKENS
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_MAX_OUTPUT_TOKENS',
        `maxOutputTokens must be an integer between 1 and ${MAX_OUTPUT_TOKENS}`,
      );
    }

    return value;
  }

  private prepareStopSequences(
    values:
      | readonly string[]
      | undefined,
    normalizations: string[],
  ): readonly string[] {
    if (
      values === undefined
    ) {
      return Object.freeze([]);
    }

    if (
      !Array.isArray(values)
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_STOP_SEQUENCE',
        'stopSequences must be an array',
      );
    }

    const seen =
      new Set<string>();

    const prepared: string[] =
      [];

    values.forEach(
      (
        value,
        index,
      ) => {
        if (
          typeof value !==
          'string'
        ) {
          throw new AiRequestPreparationError(
            'AI_REQUEST_INVALID_STOP_SEQUENCE',
            `Stop sequence ${index} must be a string`,
          );
        }

        const normalized =
          value.trim();

        if (!normalized) {
          normalizations.push(
            `stopSequences[${index}]:removed-empty`,
          );
          return;
        }

        if (
          normalized !== value
        ) {
          normalizations.push(
            `stopSequences[${index}]:trimmed`,
          );
        }

        if (
          seen.has(normalized)
        ) {
          normalizations.push(
            `stopSequences[${index}]:removed-duplicate`,
          );
          return;
        }

        seen.add(normalized);
        prepared.push(
          normalized,
        );
      },
    );

    return Object.freeze(
      prepared,
    );
  }

  private resolvePreparedAt(
    value:
      | string
      | undefined,
  ): string {
    if (
      value === undefined
    ) {
      return new Date()
        .toISOString();
    }

    const timestamp =
      Date.parse(value);

    if (
      Number.isNaN(timestamp)
    ) {
      throw new AiRequestPreparationError(
        'AI_REQUEST_INVALID_PREPARED_AT',
        'preparedAt must be a valid timestamp',
      );
    }

    return new Date(
      timestamp,
    ).toISOString();
  }

  private resolveRequestId(
    provided:
      | string
      | undefined,
    material:
      Readonly<
        Record<string, unknown>
      >,
    normalizations: string[],
  ): string {
    if (
      provided !== undefined
    ) {
      const normalized =
        provided.trim();

      if (!normalized) {
        throw new AiRequestPreparationError(
          'AI_REQUEST_INVALID_MESSAGE',
          'requestId must not be empty',
        );
      }

      if (
        normalized !== provided
      ) {
        normalizations.push(
          'requestId:trimmed',
        );
      }

      return normalized;
    }

    return `airq_${this.hash(
      this.stableStringify(
        material,
      ),
    )}`;
  }

  private stableStringify(
    value: unknown,
  ): string {
    if (
      value === null ||
      typeof value !==
        'object'
    ) {
      return JSON.stringify(
        value,
      );
    }

    if (
      Array.isArray(value)
    ) {
      return `[${value
        .map((item) =>
          this.stableStringify(
            item,
          ),
        )
        .join(',')}]`;
    }

    const record =
      value as Record<
        string,
        unknown
      >;

    return `{${Object.keys(
      record,
    )
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(
            key,
          )}:${this.stableStringify(
            record[key],
          )}`,
      )
      .join(',')}}`;
  }

  private hash(
    value: string,
  ): string {
    let hash = 2166136261;

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
      typeof value !==
        'object'
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value.map(
        (item) =>
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
    ).forEach((item) => {
      this.deepFreeze(item);
    });

    return Object.freeze(
      value,
    );
  }
}
