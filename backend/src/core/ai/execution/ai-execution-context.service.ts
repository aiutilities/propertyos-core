import {
  randomUUID,
} from 'crypto';

import {
  Injectable,
} from '@nestjs/common';

import {
  AiExecutionContext,
  AiExecutionContextInput,
  AiExecutionContextTimestamps,
} from '../types/ai-execution-context.types';

@Injectable()
export class AiExecutionContextService {
  create(
    input: AiExecutionContextInput,
  ): AiExecutionContext {
    if (
      !input ||
      typeof input !== 'object'
    ) {
      throw new TypeError(
        'AI execution context input is required',
      );
    }

    const tenantId =
      this.requiredIdentifier(
        input.tenantId,
        'tenantId',
      );

    const requestId =
      this.optionalIdentifier(
        input.requestId,
        'requestId',
      ) ?? randomUUID();

    const correlationId =
      this.optionalIdentifier(
        input.correlationId,
        'correlationId',
      ) ?? randomUUID();

    const executionId =
      this.optionalIdentifier(
        input.executionId,
        'executionId',
      ) ?? randomUUID();

    if (
      !Number.isInteger(
        input.attempt,
      ) ||
      input.attempt <= 0
    ) {
      throw new TypeError(
        'attempt must be a positive integer',
      );
    }

    if (
      !Number.isInteger(
        input.timeoutMs,
      ) ||
      input.timeoutMs <= 0
    ) {
      throw new TypeError(
        'timeoutMs must be a positive integer',
      );
    }

    const now =
      new Date()
        .toISOString();

    const createdAt =
      this.timestamp(
        input.timestamps
          ?.createdAt,
        'createdAt',
        now,
      );

    const startedAt =
      this.timestamp(
        input.timestamps
          ?.startedAt,
        'startedAt',
        createdAt,
      );

    const metadata =
      this.deepFreeze(
        this.deepClone(
          input.metadata ?? {},
        ),
      );

    const timestamps:
      AiExecutionContextTimestamps =
      Object.freeze({
        createdAt,
        startedAt,
      });

    return Object.freeze({
      tenantId,
      requestId,
      correlationId,
      executionId,
      attempt:
        input.attempt,
      capability:
        input.capability,
      classification:
        input.classification,
      executionMode:
        input.executionMode,
      timeoutMs:
        input.timeoutMs,
      metadata,
      timestamps,
    });
  }

  private requiredIdentifier(
    value: string,
    field: string,
  ): string {
    const normalized =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (!normalized) {
      throw new TypeError(
        `${field} is required`,
      );
    }

    return normalized;
  }

  private optionalIdentifier(
    value:
      | string
      | undefined,
    field: string,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (!normalized) {
      throw new TypeError(
        `${field} must not be empty`,
      );
    }

    return normalized;
  }

  private timestamp(
    value:
      | string
      | undefined,
    field: string,
    fallback: string,
  ): string {
    if (value === undefined) {
      return fallback;
    }

    const parsed =
      Date.parse(value);

    if (
      Number.isNaN(parsed)
    ) {
      throw new TypeError(
        `${field} must be a valid timestamp`,
      );
    }

    return new Date(
      parsed,
    ).toISOString();
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
      typeof value !== 'object' ||
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
