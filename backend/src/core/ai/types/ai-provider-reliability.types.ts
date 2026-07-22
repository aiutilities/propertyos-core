export interface AiProviderReliabilityProfile {
  providerName: string;

  totalExecutions: number;

  successfulExecutions: number;

  failedExecutions: number;

  recoveryAttempts: number;

  successfulRecoveries: number;

  successRate: number;

  recoverySuccessRate: number;

  healthScore: number;
}
