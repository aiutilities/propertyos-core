import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  HelpdeskRiskAnalyzerService,
} from './helpdesk-risk-analyzer.service';


describe(
  'HelpdeskRiskAnalyzerService',
  () => {


    const service =
      new HelpdeskRiskAnalyzerService();


    it(
      'detects urgent helpdesk request',
      () => {


        const signals =
          service.analyze([
            {

              id:
                'helpdesk-1',

              ticketNumber:
                'HD-001',

              title:
                'Water leakage complaint',

              description:
                'Urgent issue',

              categoryId:
                'maintenance',

              propertyId:
                'property-001',

              reporterPersonId:
                'tenant-1',

              priority:
                'URGENT' as any,

              status:
                'OPEN' as any,

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

              category:
                'HELPDESK',

              severity:
                'HIGH',
            }),
          );
      },
    );


    it(
      'detects escalated ticket',
      () => {


        const signals =
          service.analyze([
            {

              id:
                'helpdesk-2',

              ticketNumber:
                'HD-002',

              title:
                'Tenant escalation',

              description:
                'Pending',

              categoryId:
                'support',

              propertyId:
                'property-001',

              reporterPersonId:
                'tenant-1',

              priority:
                'MEDIUM' as any,

              status:
                'ESCALATED' as any,

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
