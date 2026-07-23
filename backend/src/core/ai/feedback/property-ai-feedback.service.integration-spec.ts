import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiOutcomeMemoryService,
} from '../memory/property-ai-outcome-memory.service';

import {
  PropertyAiFeedbackService,
} from './property-ai-feedback.service';


describe(
  'PropertyAiFeedbackService',
  () => {


    it(
      'analyzes outcome history into feedback insights',
      async () => {


        const records: any[] = [];

        const repository = {

          create:
            async (memory: any) => {
              records.push(memory);
              return memory;
            },

          findByProperty:
            async (propertyId: string) =>
              records.filter(
                item =>
                  item.propertyId === propertyId,
              ),

          findSuccessful:
            async (propertyId: string) =>
              records.filter(
                item =>
                  item.propertyId === propertyId
                  &&
                  item.executionStatus === 'SUCCESS',
              ),

          count:
            async () =>
              records.length,

        } as any;


        const memory =
          new PropertyAiOutcomeMemoryService(
            repository,
          );


        memory.record({

          id:
            'outcome-001',

          propertyId:
            'property-001',

          action:
            'REVIEW_MAINTENANCE',

          recommendationConfidence:
            0.90,

          executionStatus:
            'SUCCESS',

          impactScore:
            20,

          notes:
            'Maintenance backlog reduced',

          createdAt:
            new Date()
              .toISOString(),

        });


        memory.record({

          id:
            'outcome-002',

          propertyId:
            'property-001',

          action:
            'REVIEW_MAINTENANCE',

          recommendationConfidence:
            0.90,

          executionStatus:
            'SUCCESS',

          impactScore:
            30,

          notes:
            'Issue resolution improved',

          createdAt:
            new Date()
              .toISOString(),

        });


        memory.record({

          id:
            'outcome-003',

          propertyId:
            'property-001',

          action:
            'REVIEW_MAINTENANCE',

          recommendationConfidence:
            0.90,

          executionStatus:
            'FAILED',

          impactScore:
            -10,

          notes:
            'Tenant escalation continued',

          createdAt:
            new Date()
              .toISOString(),

        });


        const service =
          new PropertyAiFeedbackService(
            memory,
          );


        const result =
          await service.analyze(
            'property-001',
          );


        expect(
          result.length,
        )
        .toBe(
          1,
        );


        expect(
          result[0].action,
        )
        .toBe(
          'REVIEW_MAINTENANCE',
        );


        expect(
          result[0].executionCount,
        )
        .toBe(
          3,
        );


        expect(
          result[0].successCount,
        )
        .toBe(
          2,
        );


        expect(
          result[0].confidenceAdjustment,
        )
        .toBe(
          0,
        );

      },
    );


  },
);
