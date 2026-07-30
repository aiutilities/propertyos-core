export type AiPromptRole = "system" | "user" | "assistant";
export type AiPromptScope = "core" | "plugin";
export type AiPromptStatus = "active" | "deprecated";
export type AiPromptVariableType =
  | "string"
  | "number"
  | "boolean"
  | "string[]"
  | "json";

export type AiPromptJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly AiPromptJsonValue[]
  | { readonly [key: string]: AiPromptJsonValue };

export interface AiPromptVariableDefinition {
  readonly name: string;
  readonly required: boolean;
  readonly type: AiPromptVariableType;
  readonly description?: string;
  readonly defaultValue?: unknown;
}

export interface AiPromptMessageTemplate {
  readonly role: AiPromptRole;
  readonly template: string;
}

export interface AiPromptManifest {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly scope: AiPromptScope;
  readonly pluginId?: string;
  readonly status: AiPromptStatus;
  readonly messages: readonly AiPromptMessageTemplate[];
  readonly variables: readonly AiPromptVariableDefinition[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiPromptListFilters {
  readonly id?: string;
  readonly version?: string;
  readonly scope?: AiPromptScope;
  readonly status?: AiPromptStatus;
}

export interface AiRenderedPromptMessage {
  readonly role: AiPromptRole;
  readonly content: string;
}

export interface AiRenderedPrompt {
  readonly promptId: string;
  readonly version: string;
  readonly messages: readonly AiRenderedPromptMessage[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
