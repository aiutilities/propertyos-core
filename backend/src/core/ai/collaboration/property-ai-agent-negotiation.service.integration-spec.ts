import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentNegotiationService,
} from './property-ai-agent-negotiation.service';


describe(
  'PropertyAiAgentNegotiationService',
  () => {


    it(
      'selects the recommendation supported by the majority',
      () => {


        const service =
          new PropertyAiAgentNegotiationService();


        const result =
          service.negotiate(

            'property-001',

            [
              {
                agentId:
                  'maintenance-agent',

                recommendation:
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.9,

                reasoning:
                  'Repair backlog is high',
              },

              {
                agentId:
                  'helpdesk-agent',

                recommendation:
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.8,

                reasoning:
                  'Repeated tenant complaints',
              },

              {
                agentId:
                  'finance-agent',

                recommendation:
                  'DEFER_REPAIR_ACTION',

                confidence:
                  0.95,

                reasoning:
                  'Budget pressure',
              },
            ],

          );


        expect(
          result.selectedProposal.recommendation,
        )
        .toBe(
          'CREATE_REPAIR_ACTION',
        );


        expect(
          result.supportingAgentIds,
        )
        .toEqual(
          [
            'maintenance-agent',
            'helpdesk-agent',
          ],
        );


        expect(
          result.conflictingAgentIds,
        )
        .toEqual(
          [
            'finance-agent',
          ],
        );


        expect(
          result.agreementScore,
        )
        .toBe(
          0.57,
        );

      },
    );


    it(
      'uses confidence to break an equal recommendation split',
      () => {


        const service =
          new PropertyAiAgentNegotiationService();


        const result =
          service.negotiate(

            'property-001',

            [
              {
                agentId:
                  'maintenance-agent',

                recommendation:
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.8,

                reasoning:
                  'Maintenance risk',
              },

              {
                agentId:
                  'finance-agent',

                recommendation:
                  'DEFER_REPAIR_ACTION',

                confidence:
                  0.9,

                reasoning:
                  'Financial risk',
              },
            ],

          );


        expect(
          result.selectedProposal.recommendation,
        )
        .toBe(
          'DEFER_REPAIR_ACTION',
        );


        expect(
          result.agreementScore,
        )
        .toBe(
          0.45,
        );

      },
    );


    it(
      'prefers higher expertise weight when confidence is equal',
      () => {

        const service =
          new PropertyAiAgentNegotiationService();

        const result =
          service.negotiate(
            'property-001',
            [
              {
                agentId:
                  'maintenance',

                recommendation:
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.80,

                expertiseWeight:
                  2,

                reasoning:
                  '',
              },

              {
                agentId:
                  'general',

                recommendation:
                  'CREATE_INSPECTION',

                confidence:
                  0.80,

                expertiseWeight:
                  1,

                reasoning:
                  '',
              },
            ],
          );

        expect(
          result.selectedProposal.agentId,
        )
        .toBe(
          'maintenance',
        );

      },
    );


  },
);
