import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAgentDecision,
} from '../types/property-agent-decision.types';


export interface PropertyAgentRecommendation {

  agentId:
    string;

  recommendation:
    string;

  confidence:
    number;

}


@Injectable()
export class PropertyAgentDecisionAggregatorService {


  aggregate(
    propertyId:
      string,

    recommendations:
      PropertyAgentRecommendation[],
  ):
    PropertyAgentDecision {


    if (
      recommendations.length === 0
    ) {

      throw new Error(
        'No agent recommendations available',
      );

    }


    const sorted =
      [...recommendations]
        .sort(
          (
            a,
            b,
          ) =>
            b.confidence -
            a.confidence,
        );


    const primary =
      sorted[0];


    return {

      propertyId,

      decision:
        primary.recommendation,

      confidence:
        primary.confidence,

      contributingAgents:
        recommendations.map(
          item =>
            item.agentId,
        ),

      rationale:
        `Decision aggregated from ${recommendations.length} specialist agents`,

    };

  }

}
