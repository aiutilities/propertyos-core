export interface AiRecoveryBudget {
  maxAttempts: number;
  attemptsUsed: number;
}

export interface AiRecoveryBudgetStatus {
  allowed: boolean;
  remainingAttempts: number;
  reason: string;
}
