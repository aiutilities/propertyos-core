import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentGovernanceBindingService,
} from './ai-agent-governance-binding.service';


describe(
  'AiAgentGovernanceBindingService',
  () => {


    const service =
      new AiAgentGovernanceBindingService();


    it(
      'allows autonomous low risk decision',
      () => {

        expect(
          service.evaluate({
            agentId:
              'maintenance-agent',

            autonomyLevel:
              'AUTONOMOUS',

            capabilityId:
              'ticket_analysis',

            riskLevel:
              'LOW',

            confidence:
              0.95,
          }),
        ).toEqual(
          expect.objectContaining({

            allowed:
              true,

            decision:
              'ALLOW',
          }),
        );
      },
    );


    it(
      'requires approval for high risk capability',
      () => {

        expect(
          service.evaluate({
            agentId:
              'finance-agent',

            autonomyLevel:
              'AUTONOMOUS',

            capabilityId:
              'payment_execution',

            riskLevel:
              'HIGH',

            confidence:
              0.95,
          }),
        ).toEqual(
          expect.objectContaining({

            allowed:
              false,

            decision:
              'REQUIRES_APPROVAL',
          }),
        );
      },
    );


    it(
      'blocks low confidence execution',
      () => {

        expect(
          service.evaluate({
            agentId:
              'support-agent',

            autonomyLevel:
              'AUTONOMOUS',

            capabilityId:
              'response_generation',

            riskLevel:
              'LOW',

            confidence:
              0.3,
          }),
        ).toEqual(
          expect.objectContaining({

            allowed:
              false,

            decision:
              'BLOCK',
          }),
        );
      },
    );


  },
);
