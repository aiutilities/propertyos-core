import {
  AiExecutionContext,
} from './ai-execution-context.types';

import {
  AiPreparedRequestDispatchEnvelope,
} from './ai-prepared-request-dispatch.types';

import {
  AiResponse,
} from './ai.types';

export type AiDispatchExecutionOutcome =
  | 'SUCCEEDED'
  | 'FAILED';

export interface AiDispatchExecutionInput {
  envelope:
    AiPreparedRequestDispatchEnvelope;
  context:
    AiExecutionContext;
}

export interface AiDispatchExecutionEvidence {
  readonly executionId: string;
  readonly dispatchId: string;
  readonly requestId: string;
  readonly provider: string;
  readonly runtimeProvider: string;
  readonly protocol: string;
  readonly model: string;
  readonly messageCount: number;
  readonly outcome:
    AiDispatchExecutionOutcome;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly providerResolved: boolean;
  readonly providerInvoked: boolean;
  readonly validations:
    readonly string[];
}

export interface AiDispatchExecutionResult {
  readonly executionId: string;
  readonly dispatchId: string;
  readonly requestId: string;
  readonly provider: string;
  readonly model: string;
  readonly response: AiResponse;
  readonly metadata?:
    Readonly<Record<string, unknown>>;
  readonly evidence:
    AiDispatchExecutionEvidence;
}
