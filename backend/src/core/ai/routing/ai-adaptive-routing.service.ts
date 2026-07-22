import {
  Injectable,
} from '@nestjs/common';

import {
  AiProviderReliabilityService,
} from '../recovery/ai-provider-reliability.service';

import {
  AiRoutingSignal,
} from '../types/ai-routing-signal.types';


@Injectable()
export class AiAdaptiveRoutingService {

  constructor(
    private readonly reliabilityService:
      AiProviderReliabilityService,
  ) {}


  evaluate(
    providers: string[],
    capability?: string,
  ): AiRoutingSignal[] {

    return providers.map(
      (providerName) => {

        const profile =
          this.reliabilityService.calculate(
            providerName,
          );

        const reliabilityScore =
          profile.healthScore;


        let recommendation:
          AiRoutingSignal['recommendation'];


        if (
          reliabilityScore >= 80
        ) {
          recommendation =
            'PREFER';
        }
        else if (
          reliabilityScore >= 50
        ) {
          recommendation =
            'ALLOW';
        }
        else {
          recommendation =
            'AVOID';
        }


        return {
          providerName,

          capability,

          reliabilityScore,

          confidence:
            profile.totalExecutions === 0
              ? 0
              :
              Math.min(
                profile.totalExecutions / 10,
                1,
              ),

          recommendation,

          reason:
            `Reliability score ${reliabilityScore}`,
        };
      },
    );
  }


  selectBest(
    providers: string[],
    capability?: string,
  ): AiRoutingSignal | undefined {

    return this.evaluate(
      providers,
      capability,
    )
    .sort(
      (a, b) =>
        b.reliabilityScore -
        a.reliabilityScore,
    )[0];
  }
}
