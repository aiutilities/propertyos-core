import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyRiskEvaluation,
} from '../types/property-risk-evaluation.types';

import {
  PropertyHealthAdvisory,
} from '../types/property-health-advisory.types';


@Injectable()
export class PropertyHealthAdvisoryService {


  advise(
    evaluation:
      PropertyRiskEvaluation,
  ): PropertyHealthAdvisory {


    const actions:
      string[] = [];


    if (
      evaluation.overallRisk === 'HIGH'
    ) {

      actions.push(
        'Review high priority operational issues',
      );

      actions.push(
        'Assign owners for unresolved risks',
      );


      return {

        riskLevel:
          'HIGH',

        summary:
          'Property requires immediate operational attention',

        actions,

      };

    }


    if (
      evaluation.overallRisk === 'MEDIUM'
    ) {

      actions.push(
        'Review pending operational issues',
      );


      return {

        riskLevel:
          'MEDIUM',

        summary:
          'Property requires operational follow-up',

        actions,

      };

    }


    return {

      riskLevel:
        'LOW',

      summary:
        'Property operations are healthy',

      actions:
        [
          'Continue regular monitoring',
        ],

    };

  }

}
