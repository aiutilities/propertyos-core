import {
  AiFailureClassification,
} from '../types/ai-failure.types';

export class AiFailurePolicyService {
  classify(
    code: string,
    retriable: boolean,
  ): AiFailureClassification {
    switch (code) {
      case 'PROVIDER_TIMEOUT':
      case 'AI_PROVIDER_TIMEOUT':
        return {
          code,
          category: 'TIMEOUT',
          severity: 'MEDIUM',
          retriable: true,
          recoveryAction: 'FALLBACK_PROVIDER',
        };

      case 'PROVIDER_EXECUTION_FAILED':
        return {
          code,
          category: 'PROVIDER',
          severity: 'HIGH',
          retriable,
          recoveryAction: retriable
            ? 'FALLBACK_PROVIDER'
            : 'CHECK_CONFIGURATION',
        };

      case 'AI_TOKEN_LIMIT':
      case 'TOKEN_BUDGET_EXCEEDED':
        return {
          code,
          category: 'BUDGET',
          severity: 'MEDIUM',
          retriable: false,
          recoveryAction: 'REDUCE_CONTEXT',
        };

      case 'TOOL_EXECUTION_FAILED':
        return {
          code,
          category: 'TOOL',
          severity: 'HIGH',
          retriable,
          recoveryAction: retriable
            ? 'RETRY'
            : 'FIX_INPUT',
        };

      case 'UNAUTHORIZED':
      case 'AI_AUTH_FAILED':
        return {
          code,
          category: 'AUTHORIZATION',
          severity: 'HIGH',
          retriable: false,
          recoveryAction: 'REQUEST_PERMISSION',
        };

      default:
        return {
          code,
          category: 'UNKNOWN',
          severity: 'HIGH',
          retriable,
          recoveryAction: retriable
            ? 'RETRY'
            : 'NONE',
        };
    }
  }
}
