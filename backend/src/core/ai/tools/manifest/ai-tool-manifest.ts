import { AiJsonSchema, AiToolSideEffect } from "../types/ai-tool.types";

export interface AiToolManifest {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly inputSchema: AiJsonSchema;
  readonly outputSchema?: AiJsonSchema;
  readonly requiredPermissions: readonly string[];
  readonly sideEffect: AiToolSideEffect;
  readonly timeoutMs?: number;
  readonly tags?: readonly string[];
}
