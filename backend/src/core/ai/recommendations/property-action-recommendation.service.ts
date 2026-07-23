import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyHealthAdvisory,
} from '../reasoning/property-health-reasoning.types';

import {
  PropertyAiConfidenceAdaptationService,
} from '../adaptation/property-ai-confidence-adaptation.service';

import {
  PropertyActionRecommendation,
} from './property-action-recommendation.types';


@Injectable()
export class PropertyActionRecommendationService {


  constructor(
    private readonly confidenceAdaptation:
      PropertyAiConfidenceAdaptationService,
  ) {}


  async recommend(
    advisory:
      PropertyHealthAdvisory,
  ):
    Promise<PropertyActionRecommendation[]> {


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
            (
              await this.confidenceAdaptation.adjust(
                advisory.propertyId,
                'REVIEW_MAINTENANCE',
                0.90,
              )
            ).adjustedConfidence,

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
            (
              await this.confidenceAdaptation.adjust(
                advisory.propertyId,
                'REVIEW_RENT_COLLECTION',
                0.85,
              )
            ).adjustedConfidence,

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
            (
              await this.confidenceAdaptation.adjust(
                advisory.propertyId,
                'REVIEW_HELPDESK_ESCALATION',
                0.85,
              )
            ).adjustedConfidence,

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
