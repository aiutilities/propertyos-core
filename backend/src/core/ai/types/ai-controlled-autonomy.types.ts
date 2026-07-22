import {
  AiAutonomousDecisionMode,
} from './ai-autonomous-decision.types';


export interface AiControlledAutonomyResult {

  providerName: string;

  recommendation: string;

  confidence: number;

  mode: AiAutonomousDecisionMode;

  executed: boolean;

  evidenceEvent: string;

  reason: string;
}
