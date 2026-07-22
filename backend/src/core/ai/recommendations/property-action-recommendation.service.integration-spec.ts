import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyActionRecommendationService,
} from './property-action-recommendation.service';


describe(
  'PropertyActionRecommendationService',
  () => {


    it(
      'converts health advisory into action recommendations',
      () => {


        const service =
          new PropertyActionRecommendationService();


        const result =
          service.recommend({

            propertyId:
              'property-001',

            healthScore:
              55,

            riskLevel:
              'HIGH',

            summary:
              'Property health risk is HIGH',

            insights:
              [
                'High priority maintenance backlog detected',
                'High rent collection risk detected',
              ],

            actions:
              [
                'Review maintenance queue',
                'Follow up on overdue rent',
              ],

            generatedAt:
              new Date()
                .toISOString(),

          });


        expect(
          result.length,
        )
        .toBe(
          2,
        );


        expect(
          result[0].action,
        )
        .toBe(
          'REVIEW_MAINTENANCE',
        );


        expect(
          result[1].action,
        )
        .toBe(
          'REVIEW_RENT_COLLECTION',
        );


        expect(
          result.every(
            recommendation =>
              recommendation.requiresApproval,
          ),
        )
        .toBe(
          true,
        );

      },
    );


  },
);
