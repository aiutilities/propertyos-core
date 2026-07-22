export type AiJsonPrimitive = string | number | boolean | null;

export type AiJsonValue =
  | AiJsonPrimitive
  | AiJsonValue[]
  | {
      readonly [key: string]: AiJsonValue;
    };

export interface AiJsonSchema {
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, AiJsonSchema>>;
  readonly required?: readonly string[];
  readonly items?: AiJsonSchema;
  readonly enum?: readonly AiJsonValue[];
  readonly additionalProperties?: boolean | AiJsonSchema;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;
  readonly default?: AiJsonValue;
  readonly examples?: readonly AiJsonValue[];
  readonly [keyword: string]: unknown;
}

export type AiToolSideEffect = "none" | "read" | "write";

export interface AiToolExecutionContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly permissions: readonly string[];
  readonly propertyId?: string;
  readonly requestId?: string;
  readonly conversationId?: string;
  readonly metadata?: Readonly<Record<string, AiJsonValue>>;
}

export interface AiToolInvocation {
  readonly toolId: string;
  readonly input: AiJsonValue;
  readonly context: AiToolExecutionContext;
}

export interface AiToolExecutionSuccess {
  readonly success: true;
  readonly output: AiJsonValue;
  readonly durationMs: number;
}

export interface AiToolExecutionFailure {
  readonly success: false;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly durationMs: number;
  readonly retryable: boolean;
}

export type AiToolExecutionResult =
  AiToolExecutionSuccess | AiToolExecutionFailure;
