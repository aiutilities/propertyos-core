import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiLearningService,
} from '../../learning/property-ai-learning.service';

import {
  PropertyAiConfidenceAdaptationService,
} from '../../adaptation/property-ai-confidence-adaptation.service';

import {
  PropertyAiAgentStrategySelection,
} from './property-ai-agent-strategy-selection.types';


@Injectable()
export class PropertyAiAgentStrategySelectionService {


  constructor(

    private readonly learning:
      PropertyAiLearningService,

    private readonly confidence:
      PropertyAiConfidenceAdaptationService,

  ) {}


  async decide(

    propertyId:
      string,

    action:
      string,

    currentConfidence:
      number,

  ):
    Promise<PropertyAiAgentStrategySelection> {


    const profile =
      await this.learning.buildProfile(
        propertyId,
      );


    const adjustment =
      await this.confidence.adjust(
        propertyId,
        action,
        currentConfidence,
      );


    const learned =
      profile.actions.find(
        item =>
          item.action === action,
      );


    if (
      adjustment.successRate >= 0.8
    ) {

      return {

        propertyId,

        action,

        decision:
          'RETRY',

        confidenceAdjustment:
          adjustment.adjustment,

        reason:
          'Historical execution success supports retry',

        successRate:
          adjustment.successRate,

        historicalExecutions:
          adjustment.historicalExecutions,

      };

    }


    if (
      adjustment.successRate < 0.5
      &&
      learned
    ) {

      return {

        propertyId,

        action,

        decision:
          'CHANGE_STRATEGY',

        confidenceAdjustment:
          adjustment.adjustment,

        reason:
          'Historical performance indicates current strategy is ineffective',

        successRate:
          adjustment.successRate,

        historicalExecutions:
          adjustment.historicalExecutions,

      };

    }


    return {

      propertyId,

      action,

      decision:
        'ESCALATE',

      confidenceAdjustment:
        adjustment.adjustment,

      reason:
        'Insufficient confidence for autonomous retry',

      successRate:
        adjustment.successRate,

      historicalExecutions:
        adjustment.historicalExecutions,

    };

  }

}
