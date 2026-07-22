import {
  Injectable,
} from '@nestjs/common';

import {
  AiProviderReliabilityService,
} from '../recovery/ai-provider-reliability.service';

import {
  AiProviderPerformanceService,
} from '../performance/ai-provider-performance.service';

import {
  AiProviderIntelligenceProfile,
} from '../types/ai-provider-intelligence.types';


@Injectable()
export class AiProviderIntelligenceService {

  constructor(
    private readonly reliabilityService:
      AiProviderReliabilityService,

    private readonly performanceService:
      AiProviderPerformanceService,
  ) {}


  evaluate(
    providerName: string,
  ): AiProviderIntelligenceProfile {

    const reliability =
      this.reliabilityService.calculate(
        providerName,
      );


    const performance =
      this.performanceService.calculate(
        providerName,
      );


    const overallScore =
      Math.round(
        (
          reliability.healthScore * 0.6
        )
        +
        (
          performance.performanceScore * 0.4
        ),
      );


    let recommendation:
      AiProviderIntelligenceProfile['recommendation'];


    if (
      overallScore >= 85
    ) {
      recommendation =
        'PRIMARY';
    }
    else if (
      overallScore >= 60
    ) {
      recommendation =
        'SECONDARY';
    }
    else {
      recommendation =
        'AVOID';
    }


    const confidence =
      Math.min(
        (
          reliability.totalExecutions +
          performance.totalExecutions
        ) / 20,
        1,
      );


    return {
      providerName,

      reliabilityScore:
        reliability.healthScore,

      performanceScore:
        performance.performanceScore,

      overallScore,

      confidence,

      recommendation,
    };
  }
}
