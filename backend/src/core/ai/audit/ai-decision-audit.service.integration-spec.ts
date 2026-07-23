import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AiDecisionAuditService,
} from './ai-decision-audit.service';


describe(
  'AiDecisionAuditService',
  () => {


    it(
      'stores and retrieves AI decision audits',
      () => {


        const service =
          new AiDecisionAuditService();


        service.record({

          id:
            'audit-001',

          propertyId:
            'property-001',

          command:
            'ANALYZE_PROPERTY_HEALTH',

          confidence:
            0.90,

          decision:
            'CREATE_OPERATIONAL_ACTION',

          governanceResult:
            'APPROVED',

          action:
            'REVIEW_MAINTENANCE',

          executionStatus:
            'EXECUTED',

          createdAt:
            new Date(),

        });


        const records =
          service.listByProperty(
            'property-001',
          );


        expect(
          records.length,
        )
        .toBe(
          1,
        );


        expect(
          records[0].command,
        )
        .toBe(
          'ANALYZE_PROPERTY_HEALTH',
        );


        expect(
          service.count(),
        )
        .toBe(
          1,
        );

      },
    );


  },
);
