import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiOutcomeMemoryService,
} from '../memory/property-ai-outcome-memory.service';

import {
  PropertyAiFeedbackInsight,
} from './property-ai-feedback.types';


@Injectable()
export class PropertyAiFeedbackService {


  constructor(
    private readonly memory:
      PropertyAiOutcomeMemoryService,
  ) {}


  analyze(
    propertyId:
      string,
  ):
    PropertyAiFeedbackInsight[] {


    const outcomes =
      this.memory.listByProperty(
        propertyId,
      );


    const grouped =
      new Map<
        string,
        typeof outcomes
      >();


    for (
      const outcome
      of outcomes
    ) {

      const existing =
        grouped.get(
          outcome.action,
        )
        ?? [];


      existing.push(
        outcome,
      );


      grouped.set(
        outcome.action,
        existing,
      );

    }


    return Array.from(
      grouped.entries(),
    )
    .map(
      (
        [
          action,
          actions,
        ],
      ) => {


        const successCount =
          actions.filter(
            item =>
              item.executionStatus
                === 'SUCCESS',
          )
          .length;


        const totalImpact =
          actions.reduce(
            (
              sum,
              item,
            ) =>
              sum + item.impactScore,
            0,
          );


        const successRate =
          actions.length === 0
            ? 0
            : successCount /
              actions.length;


        const averageImpactScore =
          actions.length === 0
            ? 0
            : totalImpact /
              actions.length;


        return {

          propertyId,

          action,

          executionCount:
            actions.length,

          successCount,

          successRate,

          averageImpactScore,

          confidenceAdjustment:
            this.calculateAdjustment(
              successRate,
              averageImpactScore,
            ),

          generatedAt:
            new Date()
              .toISOString(),

        };

      },
    );

  }


  private calculateAdjustment(
    successRate:
      number,

    impact:
      number,
  ):
    number {


    if (
      successRate >= 0.8
      &&
      impact > 0
    ) {

      return 0.05;

    }


    if (
      successRate < 0.5
    ) {

      return -0.05;

    }


    return 0;

  }

}
