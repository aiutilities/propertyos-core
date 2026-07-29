import {
  PlacesDispatcher,
  PlacesProviderOperationUnavailableError,
  PlacesProviderRegistry,
} from '../index';

describe(
  'PlacesDispatcher',
  () => {
    it(
      'dispatches place search',
      async () => {
        const search =
          jest.fn(
            async () => ({
              providerName:
                'example',

              places: [],
            }),
          );

        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'example',

          capabilities: [
            'PLACE_SEARCH',
          ],

          search,
        });

        const dispatcher =
          new PlacesDispatcher({
            registry,
          });

        await expect(
          dispatcher.search({
            providerName:
              'example',

            request: {
              query:
                'hospital',
            },
          }),
        ).resolves.toEqual({
          providerName:
            'example',

          places: [],
        });

        expect(search)
          .toHaveBeenCalledTimes(1);
      },
    );

    it(
      'dispatches nearby search',
      async () => {
        const nearby =
          jest.fn(
            async () => ({
              providerName:
                'example',

              places: [],
            }),
          );

        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'example',

          capabilities: [
            'NEARBY_SEARCH',
          ],

          nearby,
        });

        await expect(
          new PlacesDispatcher({
            registry,
          }).nearby({
            providerName:
              'example',

            request: {
              coordinate: {
                latitude:
                  13,

                longitude:
                  80,
              },

              radiusMeters:
                1000,
            },
          }),
        ).resolves.toMatchObject({
          providerName:
            'example',
        });
      },
    );

    it(
      'dispatches place details',
      async () => {
        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'example',

          capabilities: [
            'PLACE_DETAILS',
          ],

          async details() {
            return {
              providerName:
                'example',

              place: {
                id:
                  'place-1',

                providerName:
                  'example',

                name:
                  'Example Hospital',

                coordinate: {
                  latitude:
                    13,

                  longitude:
                    80,
                },

                categories: [
                  'HOSPITAL',
                ],
              },
            };
          },
        });

        await expect(
          new PlacesDispatcher({
            registry,
          }).details({
            providerName:
              'example',

            request: {
              placeId:
                'place-1',
            },
          }),
        ).resolves.toMatchObject({
          place: {
            name:
              'Example Hospital',
          },
        });
      },
    );

    it(
      'rejects unavailable provider operations',
      async () => {
        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'search-only',

          capabilities: [
            'PLACE_SEARCH',
          ],

          async search() {
            return {
              providerName:
                'search-only',

              places: [],
            };
          },
        });

        await expect(
          new PlacesDispatcher({
            registry,
          }).nearby({
            providerName:
              'search-only',

            request: {
              coordinate: {
                latitude:
                  13,

                longitude:
                  80,
              },

              radiusMeters:
                1000,
            },
          }),
        ).rejects.toBeInstanceOf(
          PlacesProviderOperationUnavailableError,
        );
      },
    );
  },
);
