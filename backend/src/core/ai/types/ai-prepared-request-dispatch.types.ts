import {
  AiPreparedProviderRequest,
} from './ai-request-preparation.types';

export type AiPreparedRequestDispatchProtocol =
  | 'OPENAI_COMPATIBLE'
  | 'ANTHROPIC_MESSAGES';

export interface AiPreparedRequestDispatchTarget {
  provider: string;
  runtimeProvider: string;
  protocol: string;
  model?: string;
  enabled?: boolean;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface AiPreparedRequestDispatchInput {
  request: AiPreparedProviderRequest;
  target: AiPreparedRequestDispatchTarget;
  dispatchId?: string;
  dispatchedAt?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface AiPreparedRequestDispatchEvidence {
  readonly dispatchId: string;
  readonly requestId: string;
  readonly provider: string;
  readonly runtimeProvider: string;
  readonly protocol: AiPreparedRequestDispatchProtocol;
  readonly model: string;
  readonly messageCount: number;
  readonly maxOutputTokens: number;
  readonly dispatchedAt: string;
  readonly validations: readonly string[];
  readonly normalizations: readonly string[];
}

export interface AiPreparedRequestDispatchEnvelope {
  readonly dispatchId: string;
  readonly requestId: string;
  readonly provider: string;
  readonly runtimeProvider: string;
  readonly protocol: AiPreparedRequestDispatchProtocol;
  readonly model: string;
  readonly request: AiPreparedProviderRequest;
  readonly targetMetadata?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly evidence: AiPreparedRequestDispatchEvidence;
}
