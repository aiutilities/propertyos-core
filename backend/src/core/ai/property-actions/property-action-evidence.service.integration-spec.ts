import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyActionEvidenceService,
} from './property-action-evidence.service';


describe(
  'PropertyActionEvidenceService',
  () => {


    it(
      'creates property action evidence',
      async () => {

        let captured:
          unknown;

        const evidence =
          {
            recordPropertyAction:
              async (
                value: unknown,
              ) => {
                captured =
                  value;
              },
          } as any;


        const service =
          new PropertyActionEvidenceService(
            evidence,
          );


        await service.record({

          propertyId:
            'property-001',

          action:
            'REVIEW_MAINTENANCE',

          status:
            'PENDING_APPROVAL',

          message:
            'Awaiting owner approval',

        });


        expect(captured)
          .toEqual(
            expect.objectContaining({

              entityType:
                'property-action',

              propertyId:
                'property-001',

              action:
                'REVIEW_MAINTENANCE',

              status:
                'PENDING_APPROVAL',

            }),
          );

      },
    );


  },
);
