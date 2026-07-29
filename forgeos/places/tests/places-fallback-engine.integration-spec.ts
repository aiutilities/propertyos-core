import {
  InMemoryPlacesProviderHealthStore,
  PlacesDispatcher,
  PlacesFallbackEngine,
  PlacesProviderRegistry,
  PlacesProviderSelection,
} from '../index';

describe(
  'PlacesFallbackEngine',
  () => {
    it(
      'falls back after a retryable provider failure',
      async () => {
        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'primary',

          capabilities: [
            'PLACE_SEARCH',
          ],

          async search() {
            throw {
              code:
                'PROVIDER_TIMEOUT',

              message:
                'Timed out',

              retryable:
                true,
            };
          },
        });

        registry.register({
          name:
            'fallback',

          capabilities: [
            'PLACE_SEARCH',
          ],

          async search() {
            return {
              providerName:
                'fallback',

              places: [],
            };
          },
        });

        const selection =
          new PlacesProviderSelection(
            {
              rules: [
                {
                  capability:
                    'PLACE_SEARCH',

                  providers: [
                    'primary',
                    'fallback',
                  ],
                },
              ],
            },

            registry,
          );

        const result =
          await new PlacesFallbackEngine({
            dispatcher:
              new PlacesDispatcher({
                registry,
              }),

            selection,
          }).search({
            query:
              'hospital',
          });

        expect(result)
          .toMatchObject({
            success:
              true,

            providerName:
              'fallback',
          });

        expect(
          result.attempts,
        ).toHaveLength(2);
      },
    );

    it(
      'does not fall back after a permanent failure',
      async () => {
        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'primary',

          capabilities: [
            'PLACE_SEARCH',
          ],

          async search() {
            throw {
              code:
                'INVALID_REQUEST',

              message:
                'Invalid request',

              retryable:
                false,
            };
          },
        });

        registry.register({
          name:
            'fallback',

          capabilities: [
            'PLACE_SEARCH',
          ],

          search:
            jest.fn(
              async () => ({
                providerName:
                  'fallback',

                places: [],
              }),
            ),
        });

        const selection =
          new PlacesProviderSelection(
            {
              rules: [
                {
                  capability:
                    'PLACE_SEARCH',

                  providers: [
                    'primary',
                    'fallback',
                  ],
                },
              ],
            },

            registry,
          );

        const result =
          await new PlacesFallbackEngine({
            dispatcher:
              new PlacesDispatcher({
                registry,
              }),

            selection,
          }).search({
            query:
              'hospital',
          });

        expect(result)
          .toMatchObject({
            success:
              false,

            retryable:
              false,
          });

        expect(
          registry.require(
            'fallback',
          ).search,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'tracks temporary provider health',
      () => {
        const store =
          new InMemoryPlacesProviderHealthStore();

        store.recordFailure(
          'provider',
          100,
          1000,
        );

        expect(
          store.isHealthy(
            'provider',
            500,
          ),
        ).toBe(false);

        expect(
          store.isHealthy(
            'provider',
            1100,
          ),
        ).toBe(true);
      },
    );
  },
);
