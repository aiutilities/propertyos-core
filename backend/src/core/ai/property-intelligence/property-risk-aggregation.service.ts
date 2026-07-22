import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyRiskSignal,
} from '../types/property-risk-signal.types';

import {
  PropertyRiskEvaluation,
} from '../types/property-risk-evaluation.types';


@Injectable()
export class PropertyRiskAggregationService {


  evaluate(
    signals:
      PropertyRiskSignal[],
  ): PropertyRiskEvaluation {


    const hasHigh =
      signals.some(
        signal =>
          signal.severity === 'HIGH',
      );


    const hasMedium =
      signals.some(
        signal =>
          signal.severity === 'MEDIUM',
      );


    let overallRisk:
      PropertyRiskEvaluation['overallRisk'] =
        'LOW';


    if (hasHigh) {

      overallRisk =
        'HIGH';

    } else if (hasMedium) {

      overallRisk =
        'MEDIUM';

    }


    const recommendations:
      string[] = [];


    if (overallRisk === 'HIGH') {

      recommendations.push(
        'Immediate operational attention required',
      );

    }


    if (overallRisk === 'MEDIUM') {

      recommendations.push(
        'Review pending operational issues',
      );

    }


    return {

      signals,

      overallRisk,

      recommendations,

    };
  }
}
