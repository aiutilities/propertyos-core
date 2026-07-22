import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyHealthAdvisory,
} from '../reasoning/property-health-reasoning.types';

import {
  PropertyActionRecommendation,
} from './property-action-recommendation.types';


@Injectable()
export class PropertyActionRecommendationService {


  recommend(
    advisory:
      PropertyHealthAdvisory,
  ):
    PropertyActionRecommendation[] {


    const recommendations:
      PropertyActionRecommendation[] =
      [];


    for (
      const action
      of advisory.actions
    ) {


      if (
        action.includes(
          'maintenance',
        )
      ) {

        recommendations.push({

          propertyId:
            advisory.propertyId,

          action:
            'REVIEW_MAINTENANCE',

          reason:
            action,

          confidence:
            0.90,

          priority:
            advisory.riskLevel
              === 'HIGH'
              ? 'HIGH'
              : 'MEDIUM',

          requiresApproval:
            true,

        });

      }


      if (
        action.includes(
          'rent',
        )
      ) {

        recommendations.push({

          propertyId:
            advisory.propertyId,

          action:
            'REVIEW_RENT_COLLECTION',

          reason:
            action,

          confidence:
            0.85,

          priority:
            advisory.riskLevel
              === 'HIGH'
              ? 'HIGH'
              : 'MEDIUM',

          requiresApproval:
            true,

        });

      }


      if (
        action.includes(
          'complaint',
        )
      ) {

        recommendations.push({

          propertyId:
            advisory.propertyId,

          action:
            'REVIEW_HELPDESK_ESCALATION',

          reason:
            action,

          confidence:
            0.85,

          priority:
            'HIGH',

          requiresApproval:
            true,

        });

      }

    }


    return recommendations;

  }

}
