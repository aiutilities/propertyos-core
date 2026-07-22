import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiDecisionGovernanceService,
} from './ai-decision-governance.service';


describe(
  'AiDecisionGovernanceService',
  () => {

    const service =
      new AiDecisionGovernanceService();


    it(
      'allows high confidence approved decisions',
      () => {

        expect(
          service.evaluate(
            {
              tenantId:
                'tenant-1',

              minimumConfidence:
                0.8,

              allowedRecommendations:
                [
                  'PRIMARY',
                ],

              approvalMode:
                'AUTONOMOUS',

              auditRequired:
                true,

              rollbackRequired:
                true,
            },

            0.95,

            'PRIMARY',
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              true,

            mode:
              'AUTONOMOUS',
          }),
        );

      },
    );


    it(
      'requires approval for low confidence',
      () => {

        expect(
          service.evaluate(
            {
              tenantId:
                'tenant-1',

              minimumConfidence:
                0.9,

              allowedRecommendations:
                [
                  'PRIMARY',
                ],

              approvalMode:
                'AUTONOMOUS',

              auditRequired:
                true,

              rollbackRequired:
                true,
            },

            0.5,

            'PRIMARY',
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              false,

            mode:
              'APPROVAL_REQUIRED',
          }),
        );

      },
    );


    it(
      'blocks forbidden recommendations',
      () => {

        expect(
          service.evaluate(
            {
              tenantId:
                'tenant-1',

              minimumConfidence:
                0.5,

              allowedRecommendations:
                [
                  'PRIMARY',
                ],

              approvalMode:
                'AUTONOMOUS',

              auditRequired:
                true,

              rollbackRequired:
                true,
            },

            0.99,

            'AVOID',
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              false,

            mode:
              'BLOCKED',
          }),
        );

      },
    );

  },
);
