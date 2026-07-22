import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyRiskAggregationService,
} from './property-risk-aggregation.service';


describe(
  'PropertyRiskAggregationService',
  () => {


    const service =
      new PropertyRiskAggregationService();


    it(
      'returns high risk when high severity exists',
      () => {


        const result =
          service.evaluate([
            {

              category:
                'MAINTENANCE',

              severity:
                'HIGH',

              message:
                'SLA breached',

              source:
                'maintenance',

            },
          ]);


        expect(result.overallRisk)
          .toBe(
            'HIGH',
          );


        expect(result.recommendations)
          .toContain(
            'Immediate operational attention required',
          );

      },
    );


    it(
      'returns low risk without signals',
      () => {


        const result =
          service.evaluate([]);


        expect(result.overallRisk)
          .toBe(
            'LOW',
          );

      },
    );


  },
);
