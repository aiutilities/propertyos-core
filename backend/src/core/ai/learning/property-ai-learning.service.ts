import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiFeedbackService,
} from '../feedback/property-ai-feedback.service';

import {
  PropertyAiLearningProfile,
} from './property-ai-learning.types';


@Injectable()
export class PropertyAiLearningService {


  constructor(
    private readonly feedback:
      PropertyAiFeedbackService,
  ) {}


  async buildProfile(
    propertyId:
      string,
  ):
    Promise<PropertyAiLearningProfile> {


    const insights =
      await this.feedback.analyze(
        propertyId,
      );


    return {

      propertyId,

      actions:
        insights.map(
          insight => ({

            action:
              insight.action,

            confidenceAdjustment:
              insight.confidenceAdjustment,

            pattern:
              this.resolvePattern(
                insight.confidenceAdjustment,
              ),

            executionCount:
              insight.executionCount,

            successRate:
              insight.successRate,

          }),
        ),

      generatedAt:
        new Date()
          .toISOString(),

    };

  }


  private resolvePattern(
    adjustment:
      number,
  ) {

    if (
      adjustment > 0
    ) {

      return 'SUCCESSFUL';

    }


    if (
      adjustment < 0
    ) {

      return 'UNSUCCESSFUL';

    }


    return 'UNSTABLE';

  }

}
