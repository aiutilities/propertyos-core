import {
  Injectable,
} from '@nestjs/common';

import {
  AiPreparedRequestDispatchError,
} from '../errors/ai-prepared-request-dispatch.error';

import {
  AiPreparedRequestDispatchEnvelope,
  AiPreparedRequestDispatchEvidence,
  AiPreparedRequestDispatchInput,
  AiPreparedRequestDispatchProtocol,
} from '../types/ai-prepared-request-dispatch.types';

import {
  AiPreparedProviderRequest,
} from '../types/ai-request-preparation.types';

const SUPPORTED_PROTOCOLS =
  new Set<AiPreparedRequestDispatchProtocol>([
    'OPENAI_COMPATIBLE',
    'ANTHROPIC_MESSAGES',
  ]);

@Injectable()
export class AiPreparedRequestDispatchBoundaryService {
  createEnvelope(
    input: AiPreparedRequestDispatchInput,
  ): AiPreparedRequestDispatchEnvelope {
    if (
      !input ||
      typeof input !== 'object'
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_REQUEST_REQUIRED',
        'Dispatch input is required',
      );
    }

    const request =
      this.validateRequest(
        input.request,
      );

    const normalizations: string[] = [];
    const validations: string[] = [];

    const target =
      input.target;

    if (
      !target ||
      typeof target !== 'object'
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_TARGET_REQUIRED',
        'Dispatch target is required',
      );
    }

    const provider =
      this.normalizeRequiredIdentifier(
        target.provider,
        'provider',
        normalizations,
      );

    const runtimeProvider =
      this.normalizeRequiredIdentifier(
        target.runtimeProvider,
        'runtimeProvider',
        normalizations,
      );

    const protocol =
      this.normalizeProtocol(
        target.protocol,
        normalizations,
      );

    if (
      target.enabled === false
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_TARGET_DISABLED',
        'Dispatch target is disabled',
      );
    }

    validations.push(
      'target:enabled',
    );

    if (
      provider !==
      request.provider
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_PROVIDER_MISMATCH',
        `Prepared request provider ${request.provider} does not match dispatch provider ${provider}`,
      );
    }

    validations.push(
      'provider:matched',
    );

    const model =
      target.model === undefined
        ? request.model
        : target.model.trim();

    if (
      target.model !== undefined &&
      !model
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_MODEL_MISMATCH',
        'Dispatch target model must not be empty',
      );
    }

    if (
      target.model !== undefined &&
      model !== target.model
    ) {
      normalizations.push(
        'target.model:trimmed',
      );
    }

    if (
      model !== request.model
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_MODEL_MISMATCH',
        `Prepared request model ${request.model} does not match dispatch model ${model}`,
      );
    }

    validations.push(
      'model:matched',
    );

    validations.push(
      'protocol:supported',
    );

    validations.push(
      'request:prepared',
    );

    const dispatchedAt =
      this.resolveTimestamp(
        input.dispatchedAt,
      );

    const targetMetadata =
      target.metadata === undefined
        ? undefined
        : this.deepFreeze(
            this.deepClone(
              target.metadata,
            ),
          );

    const metadata =
      input.metadata === undefined
        ? undefined
        : this.deepFreeze(
            this.deepClone(
              input.metadata,
            ),
          );

    const dispatchMaterial = {
      requestId:
        request.requestId,
      provider,
      runtimeProvider,
      protocol,
      model,
      messageCount:
        request.messages.length,
      maxOutputTokens:
        request.maxOutputTokens,
      targetMetadata,
      metadata,
    };

    const dispatchId =
      this.resolveDispatchId(
        input.dispatchId,
        dispatchMaterial,
        normalizations,
      );

    const frozenValidations =
      Object.freeze([
        ...validations,
      ]);

    const frozenNormalizations =
      Object.freeze([
        ...normalizations,
      ]);

    const evidence:
      AiPreparedRequestDispatchEvidence =
      Object.freeze({
        dispatchId,
        requestId:
          request.requestId,
        provider,
        runtimeProvider,
        protocol,
        model,
        messageCount:
          request.messages.length,
        maxOutputTokens:
          request.maxOutputTokens,
        dispatchedAt,
        validations:
          frozenValidations,
        normalizations:
          frozenNormalizations,
      });

    return Object.freeze({
      dispatchId,
      requestId:
        request.requestId,
      provider,
      runtimeProvider,
      protocol,
      model,
      request,
      ...(targetMetadata === undefined
        ? {}
        : {
            targetMetadata,
          }),
      ...(metadata === undefined
        ? {}
        : {
            metadata,
          }),
      evidence,
    });
  }

  private validateRequest(
    request:
      | AiPreparedProviderRequest
      | undefined,
  ): AiPreparedProviderRequest {
    if (
      !request ||
      typeof request !== 'object'
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_REQUEST_REQUIRED',
        'Prepared request is required',
      );
    }

    if (
      typeof request.requestId !==
        'string' ||
      !request.requestId.trim() ||
      typeof request.provider !==
        'string' ||
      !request.provider.trim() ||
      typeof request.model !==
        'string' ||
      !request.model.trim() ||
      !Array.isArray(
        request.messages,
      ) ||
      request.messages.length === 0 ||
      !Number.isInteger(
        request.maxOutputTokens,
      ) ||
      request.maxOutputTokens <= 0
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_REQUEST_REQUIRED',
        'Prepared request is structurally invalid',
      );
    }

    return request;
  }

  private normalizeRequiredIdentifier(
    value: string,
    field:
      | 'provider'
      | 'runtimeProvider',
    normalizations: string[],
  ): string {
    const normalized =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (!normalized) {
      throw new AiPreparedRequestDispatchError(
        field === 'provider'
          ? 'AI_DISPATCH_PROVIDER_REQUIRED'
          : 'AI_DISPATCH_RUNTIME_PROVIDER_REQUIRED',
        `${field} is required`,
      );
    }

    if (
      normalized !== value
    ) {
      normalizations.push(
        `target.${field}:trimmed`,
      );
    }

    return normalized;
  }

  private normalizeProtocol(
    value: string,
    normalizations: string[],
  ): AiPreparedRequestDispatchProtocol {
    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_PROTOCOL_REQUIRED',
        'Dispatch protocol is required',
      );
    }

    const normalized =
      value
        .trim()
        .replace(
          /[-\s]+/g,
          '_',
        )
        .toUpperCase() as
        AiPreparedRequestDispatchProtocol;

    if (
      normalized !== value
    ) {
      normalizations.push(
        'target.protocol:normalized',
      );
    }

    if (
      !SUPPORTED_PROTOCOLS.has(
        normalized,
      )
    ) {
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_UNSUPPORTED_PROTOCOL',
        `Unsupported dispatch protocol: ${normalized}`,
      );
    }

    return normalized;
  }

  private resolveTimestamp(
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
      throw new AiPreparedRequestDispatchError(
        'AI_DISPATCH_INVALID_TIMESTAMP',
        'dispatchedAt must be a valid timestamp',
      );
    }

    return new Date(
      timestamp,
    ).toISOString();
  }

  private resolveDispatchId(
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
        throw new AiPreparedRequestDispatchError(
          'AI_DISPATCH_INVALID_ID',
          'dispatchId must not be empty',
        );
      }

      if (
        normalized !== provided
      ) {
        normalizations.push(
          'dispatchId:trimmed',
        );
      }

      return normalized;
    }

    return `aidp_${this.hash(
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
      this.deepFreeze(
        item,
      );
    });

    return Object.freeze(
      value,
    );
  }
}
