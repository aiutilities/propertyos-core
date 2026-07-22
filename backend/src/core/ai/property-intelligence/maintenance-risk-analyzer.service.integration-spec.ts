import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  MaintenanceRiskAnalyzerService,
} from './maintenance-risk-analyzer.service';


describe(
  'MaintenanceRiskAnalyzerService',
  () => {


    const service =
      new MaintenanceRiskAnalyzerService();


    it(
      'detects SLA breach risk',
      () => {


        const signals =
          service.analyze([
            {

              id:
                'ticket-1',

              ticketNumber:
                'MT-001',

              title:
                'Electrical repair',

              description:
                'Power issue',

              categoryId:
                'electrical',

              propertyId:
                'property-001',

              reporterPersonId:
                'person-1',

              priority:
                'NORMAL' as any,

              status:
                'OPEN' as any,

              slaDueAt:
                new Date(
                  Date.now() - 10000,
                ),

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            },
          ]);


        expect(signals)
          .toHaveLength(1);


        expect(signals[0])
          .toEqual(
            expect.objectContaining({

              severity:
                'HIGH',

              category:
                'MAINTENANCE',
            }),
          );
      },
    );


    it(
      'detects high priority issue',
      () => {


        const signals =
          service.analyze([
            {

              id:
                'ticket-2',

              ticketNumber:
                'MT-002',

              title:
                'Water leakage',

              description:
                'Leak',

              categoryId:
                'plumbing',

              propertyId:
                'property-001',

              reporterPersonId:
                'person-1',

              priority:
                'HIGH' as any,

              status:
                'OPEN' as any,

              createdAt:
                new Date(),

              updatedAt:
                new Date(),

            },
          ]);


        expect(signals[0].severity)
          .toBe(
            'HIGH',
          );
      },
    );


  },
);
