import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyOperationsAgentService,
} from './property-operations-agent.service';


describe(
  'PropertyOperationsAgentService',
  () => {


    const service =
      new PropertyOperationsAgentService();


    it(
      'returns healthy property insight',
      () => {

        expect(
          service.analyze({
            propertyId:
              'property-001',

            propertyName:
              'Advaiths Nest',

            openMaintenanceIssues:
              1,
          }),
        ).toEqual(
          expect.objectContaining({

            healthStatus:
              'HEALTHY',
          }),
        );
      },
    );


    it(
      'raises critical alert',
      () => {

        expect(
          service.analyze({
            propertyId:
              'property-001',

            propertyName:
              'Advaiths Nest',

            alerts:
              [
                'Water leakage detected',
              ],
          }),
        ).toEqual(
          expect.objectContaining({

            healthStatus:
              'CRITICAL',
          }),
        );
      },
    );


  },
);
