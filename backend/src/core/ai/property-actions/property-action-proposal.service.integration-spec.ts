import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyActionProposalService,
} from './property-action-proposal.service';


describe(
  'PropertyActionProposalService',
  () => {


    it(
      'creates governed action proposals',
      () => {

        const service =
          new PropertyActionProposalService();


        const result =
          service.create(
            'property-001',
            {
              riskLevel:
                'HIGH',

              summary:
                'Property requires immediate operational attention',

              actions:
                [
                  'Review high priority operational issues',
                  'Assign owners for unresolved risks',
                ],
            },
          );


        expect(
          result.length,
        )
          .toBe(2);


        expect(
          result[0].requiresApproval,
        )
          .toBe(true);

      },
    );

  },
);
