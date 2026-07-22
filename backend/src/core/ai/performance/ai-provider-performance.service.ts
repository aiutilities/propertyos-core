import {
  Injectable,
} from '@nestjs/common';

import {
  AiRecoveryOutcomeRepository,
} from '../recovery/ai-recovery-outcome.repository';

import {
  AiProviderReliabilityService,
} from '../recovery/ai-provider-reliability.service';

import {
  AiProviderPerformanceProfile,
} from '../types/ai-provider-performance.types';


@Injectable()
export class AiProviderPerformanceService {

  constructor(
    private readonly repository:
      AiRecoveryOutcomeRepository,

    private readonly reliabilityService:
      AiProviderReliabilityService,
  ) {}


  calculate(
    providerName: string,
  ): AiProviderPerformanceProfile {

    const outcomes =
      this.repository
        .findAll()
        .filter(
          (outcome) =>
            outcome.providerName === providerName,
        );


    const totalExecutions =
      outcomes.length;


    const averageLatencyMs =
      totalExecutions === 0
        ? 0
        :
        outcomes.reduce(
          (sum, outcome) =>
            sum +
            (outcome.latencyMs ?? 0),
          0,
        )
        /
        totalExecutions;


    const averageTokens =
      totalExecutions === 0
        ? 0
        :
        outcomes.reduce(
          (sum, outcome) =>
            sum +
            (outcome.totalTokens ?? 0),
          0,
        )
        /
        totalExecutions;


    const estimatedCost =
      averageTokens * 0.00001;


    const reliability =
      this.reliabilityService.calculate(
        providerName,
      );


    const latencyScore =
      averageLatencyMs === 0
        ? 100
        :
        Math.max(
          0,
          100 -
          (
            averageLatencyMs / 100
          ),
        );


    const performanceScore =
      Math.round(
        (
          reliability.healthScore * 0.6
        )
        +
        (
          latencyScore * 0.4
        ),
      );


    return {
      providerName,

      totalExecutions,

      averageLatencyMs,

      averageTokens,

      estimatedCost,

      reliabilityScore:
        reliability.healthScore,

      performanceScore,
    };
  }
}
