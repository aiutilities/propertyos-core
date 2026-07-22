import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiContextAssemblyService,
} from './property-ai-context-assembly.service';


describe(
  'PropertyAiContextAssemblyService',
  () => {

    it(
      'assembles property AI context',
      async () => {

        const service =
          new PropertyAiContextAssemblyService(

            {
              list:
                async () => [
                  {
                    priority:
                      'HIGH',
                    slaDueAt:
                      new Date(
                        Date.now() - 1000,
                      ),
                  },
                ],
            } as never,


            {
              list:
                async () => [
                  {
                    status:
                      'ESCALATED',
                  },
                ],
            } as never,


            {
              listTenants:
                async () => [
                  {},
                ],

              getOccupancyCounts:
                async () => ({
                  activeTenants:
                    1,

                  occupiedSpaces:
                    1,
                }),
            } as never,


            {
              listRentLedgers:
                async () => [
                  {
                    balanceAmount:
                      5000,

                    status:
                      'UNPAID',
                  },
                ],
            } as never,

          );


        const result =
          await service.assemble(
            'property-001',
          );


        expect(
          result.propertyId,
        )
        .toBe(
          'property-001',
        );


        expect(
          result.maintenance.highPriorityTickets,
        )
        .toBe(
          1,
        );


        expect(
          result.financials.pendingRentAmount,
        )
        .toBe(
          5000,
        );

      },
    );

  },
);
