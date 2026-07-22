import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyHealthReasoningService,
} from './property-health-reasoning.service';


describe(
  'PropertyHealthReasoningService',
  () => {


    it(
      'converts property context into health advisory',
      () => {


        const service =
          new PropertyHealthReasoningService();


        const result =
          service.evaluate({

            propertyId:
              'property-001',

            propertyName:
              'Test Property',


            maintenance: {

              openTickets:
                10,

              overdueTickets:
                5,

              highPriorityTickets:
                4,

            },


            helpdesk: {

              openTickets:
                8,

              escalatedTickets:
                3,

            },


            tenants: {

              total:
                20,

              active:
                18,

            },


            financials: {

              pendingRentAmount:
                50000,

              overdueCount:
                10,

            },


            generatedAt:
              new Date()
                .toISOString(),

          });


        expect(
          result.propertyId,
        )
        .toBe(
          'property-001',
        );


        expect(
          result.healthScore,
        )
        .toBe(
          25,
        );


        expect(
          result.riskLevel,
        )
        .toBe(
          'HIGH',
        );


        expect(
          result.actions.length,
        )
        .toBeGreaterThan(
          0,
        );

      },
    );


  },
);
