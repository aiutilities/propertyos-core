import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyHealthAdvisoryService,
} from './property-health-advisory.service';


describe(
  'PropertyHealthAdvisoryService',
  () => {


    const service =
      new PropertyHealthAdvisoryService();


    it(
      'creates urgent advisory for high risk',
      () => {

        const result =
          service.advise({

            overallRisk:
              'HIGH',

            signals:
              [],

            recommendations:
              [],

          });


        expect(
          result.riskLevel,
        )
          .toBe('HIGH');


        expect(
          result.actions.length,
        )
          .toBeGreaterThan(0);

      },
    );


    it(
      'creates healthy advisory for low risk',
      () => {

        const result =
          service.advise({

            overallRisk:
              'LOW',

            signals:
              [],

            recommendations:
              [],

          });


        expect(
          result.riskLevel,
        )
          .toBe('LOW');

      },
    );


  },
);
