import {
  PropertyOsAiErrorCode,
} from './ai-sdk.contracts';

export class PropertyOsAiSdkError extends Error {
  constructor(
    readonly code: PropertyOsAiErrorCode,
    message: string,
    readonly retriable: boolean,
    readonly correlationId: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'PropertyOsAiSdkError';
  }
}
