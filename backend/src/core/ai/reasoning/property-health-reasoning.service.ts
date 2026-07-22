import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiContext,
} from '../context/property-ai-context.types';

import {
  PropertyHealthAdvisory,
  PropertyRiskLevel,
} from './property-health-reasoning.types';


@Injectable()
export class PropertyHealthReasoningService {


  evaluate(
    context:
      PropertyAiContext,
  ):
    PropertyHealthAdvisory {


    let score =
      100;


    const insights:
      string[] = [];


    const actions:
      string[] = [];


    if (
      context.maintenance.highPriorityTickets >= 3
    ) {

      score -= 20;

      insights.push(
        'High priority maintenance backlog detected',
      );

      actions.push(
        'Review maintenance queue',
      );

    }


    if (
      context.maintenance.overdueTickets >= 3
    ) {

      score -= 15;

      insights.push(
        'Maintenance SLA breaches detected',
      );

      actions.push(
        'Resolve overdue maintenance items',
      );

    }


    if (
      context.helpdesk.escalatedTickets >= 2
    ) {

      score -= 20;

      insights.push(
        'Multiple escalated helpdesk issues detected',
      );

      actions.push(
        'Review escalated tenant complaints',
      );

    }


    if (
      context.financials.overdueCount >= 5
    ) {

      score -= 20;

      insights.push(
        'High rent collection risk detected',
      );

      actions.push(
        'Follow up on overdue rent',
      );

    }


    if (
      score < 0
    ) {
      score = 0;
    }


    const riskLevel:
      PropertyRiskLevel =
      this.resolveRiskLevel(
        score,
      );


    return {

      propertyId:
        context.propertyId,

      healthScore:
        score,

      riskLevel,

      summary:
        `Property health risk is ${riskLevel}`,

      insights,

      actions,

      generatedAt:
        new Date()
          .toISOString(),

    };

  }


  private resolveRiskLevel(
    score:
      number,
  ):
    PropertyRiskLevel {


    if (
      score >= 80
    ) {
      return 'LOW';
    }


    if (
      score >= 60
    ) {
      return 'MEDIUM';
    }


    return 'HIGH';

  }

}
