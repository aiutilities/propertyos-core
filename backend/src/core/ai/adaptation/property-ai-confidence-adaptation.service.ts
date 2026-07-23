import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiOutcomeMemoryService,
} from '../memory/property-ai-outcome-memory.service';

import {
  PropertyAiConfidenceAdjustment,
} from './property-ai-confidence-adaptation.types';


@Injectable()
export class PropertyAiConfidenceAdaptationService {


  constructor(
    private readonly memory:
      PropertyAiOutcomeMemoryService,
  ) {}


  async adjust(
    propertyId:
      string,

    action:
      string,

    confidence:
      number,

  ):
    Promise<PropertyAiConfidenceAdjustment> {


    const outcomes =
      await this.memory.listByProperty(
        propertyId,
      );


    const actions =
      outcomes.filter(
        outcome =>
          outcome.action === action,
      );


    if (
      actions.length === 0
    ) {

      return {

        action,

        originalConfidence:
          confidence,

        adjustedConfidence:
          confidence,

        adjustment:
          0,

        historicalExecutions:
          0,

        successRate:
          0,

      };

    }


    const successful =
      actions.filter(
        outcome =>
          outcome.executionStatus
            === 'SUCCESS',
      )
      .length;


    const successRate =
      successful /
      actions.length;


    let adjustment =
      0;


    if (
      successRate >= 0.8
    ) {

      adjustment =
        0.05;

    }


    if (
      successRate < 0.5
    ) {

      adjustment =
        -0.05;

    }


    return {

      action,

      originalConfidence:
        confidence,

      adjustedConfidence:
        Number(
          Math.min(
            1,
            Math.max(
              0,
              confidence + adjustment,
            ),
          ).toFixed(2),
        ),

      adjustment,

      historicalExecutions:
        actions.length,

      successRate,

    };

  }


}
