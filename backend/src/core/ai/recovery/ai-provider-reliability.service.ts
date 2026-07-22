import {
  Injectable,
} from '@nestjs/common';

import {
  AiRecoveryOutcomeRepository,
} from './ai-recovery-outcome.repository';

import {
  AiProviderReliabilityProfile,
} from '../types/ai-provider-reliability.types';


@Injectable()
export class AiProviderReliabilityService {

  constructor(
    private readonly repository:
      AiRecoveryOutcomeRepository,
  ) {}


  calculate(
    providerName: string,
  ): AiProviderReliabilityProfile {

    const outcomes =
      this.repository
        .findAll()
        .filter(
          (outcome) =>
            outcome.providerName === providerName,
        );


    const totalExecutions =
      outcomes.length;


    const successfulExecutions =
      outcomes.filter(
        (outcome) =>
          outcome.status === 'SUCCEEDED',
      ).length;


    const failedExecutions =
      outcomes.filter(
        (outcome) =>
          outcome.status === 'FAILED',
      ).length;


    const recoveryAttempts =
      outcomes.filter(
        (outcome) =>
          outcome.recoveryDecision.length > 0,
      ).length;


    const successfulRecoveries =
      outcomes.filter(
        (outcome) =>
          outcome.status === 'SUCCEEDED'
          &&
          outcome.recoveryDecision.length > 0,
      ).length;


    const successRate =
      totalExecutions === 0
        ? 0
        :
        successfulExecutions /
        totalExecutions;


    const recoverySuccessRate =
      recoveryAttempts === 0
        ? 0
        :
        successfulRecoveries /
        recoveryAttempts;


    const healthScore =
      Math.round(
        (
          successRate * 70
        )
        +
        (
          recoverySuccessRate * 30
        ),
      );


    return {
      providerName,

      totalExecutions,

      successfulExecutions,

      failedExecutions,

      recoveryAttempts,

      successfulRecoveries,

      successRate,

      recoverySuccessRate,

      healthScore,
    };
  }
}
