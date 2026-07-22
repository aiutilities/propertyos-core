import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyOperationsAgentContext,
  PropertyOperationsInsight,
} from '../types/property-operations-agent.types';


@Injectable()
export class PropertyOperationsAgentService {


  analyze(
    context:
      PropertyOperationsAgentContext,
  ): PropertyOperationsInsight {


    let healthStatus:
      PropertyOperationsInsight['healthStatus'] =
        'HEALTHY';


    const recommendations:
      string[] = [];


    if (
      (context.openMaintenanceIssues ?? 0) > 5
    ) {

      healthStatus =
        'WARNING';

      recommendations.push(
        'Review pending maintenance issues',
      );
    }


    if (
      context.alerts &&
      context.alerts.length > 0
    ) {

      healthStatus =
        'CRITICAL';

      recommendations.push(
        ...context.alerts,
      );
    }


    return {

      propertyId:
        context.propertyId,

      healthStatus,

      summary:
        `${context.propertyName} operational health analysed`,

      recommendations,

      generatedAt:
        new Date().toISOString(),
    };
  }
}
