import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PlacesController,
} from './places.controller';

describe(
  'PlacesController',
  () => {
    it(
      'wraps place search responses and forwards context',
      async () => {
        const service = {
          search:
            jest.fn(
              async () => ({
                providerName:
                  'photon',

                places:
                  [],
              }),
            ),
        };

        const controller =
          new PlacesController(
            service as never,
          );

        await expect(
          controller.search(
            {
              query:
                'hospital',
            },
            'request-1',
            'actor-1',
          ),
        ).resolves.toEqual({
          success:
            true,

          data: {
            providerName:
              'photon',

            places:
              [],
          },
        });

        expect(
          service.search
            .mock
            .calls,
        ).toEqual([
          [
            {
              query:
                'hospital',
            },
            {
              correlationId:
                'request-1',

              actorId:
                'actor-1',
            },
          ],
        ]);
      },
    );

    it(
      'returns Places health',
      () => {
        const controller =
          new PlacesController({
            health:
              () => ({
                enabled:
                  true,
              }),
          } as never);

        expect(
          controller.health(),
        ).toEqual({
          success:
            true,

          data: {
            enabled:
              true,
          },
        });
      },
    );
  },
);
