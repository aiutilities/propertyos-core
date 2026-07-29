import {
  CachedPlacesService,
  createPlacesCacheKey,
  InMemoryPlacesCacheStore,
  PlacesDispatcher,
  PlacesFallbackEngine,
  PlacesProviderRegistry,
  PlacesProviderSelection,
} from '../index';

function createFixture() {
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

  const selection =
    new PlacesProviderSelection(
      {
        rules: [
          {
            capability:
              'PLACE_SEARCH',

            providers: [
              'example',
            ],
          },
        ],
      },

      registry,
    );

  const service =
    new CachedPlacesService({
      engine:
        new PlacesFallbackEngine({
          dispatcher:
            new PlacesDispatcher({
              registry,
            }),

          selection,
        }),

      selection,

      cache:
        new InMemoryPlacesCacheStore(),
    });

  return {
    service,
    search,
  };
}

describe(
  'Places cache runtime',
  () => {
    it(
      'creates deterministic keys',
      () => {
        expect(
          createPlacesCacheKey({
            operation:
              'PLACE_SEARCH',

            request: {
              query:
                ' Hospital ',

              limit:
                10,
            },
          }),
        ).toBe(
          createPlacesCacheKey({
            operation:
              'PLACE_SEARCH',

            request: {
              limit:
                10,

              query:
                'Hospital',
            },
          }),
        );
      },
    );

    it(
      'caches successful searches',
      async () => {
        const fixture =
          createFixture();

        const first =
          await fixture.service
            .search({
              query:
                'hospital',
            });

        const second =
          await fixture.service
            .search({
              query:
                'hospital',
            });

        expect(
          first.metadata.cache,
        ).toBe(
          'MISS',
        );

        expect(
          second.metadata.cache,
        ).toBe(
          'HIT',
        );

        expect(
          fixture.search,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'deduplicates concurrent searches',
      async () => {
        let resolveProvider:
          (
            value:
              unknown,
          ) => void =
            () =>
              undefined;

        const search =
          jest.fn(
            () =>
              new Promise(
                (resolve) => {
                  resolveProvider =
                    resolve;
                },
              ),
          );

        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'example',

          capabilities: [
            'PLACE_SEARCH',
          ],

          search:
            search as never,
        });

        const selection =
          new PlacesProviderSelection(
            {
              rules: [
                {
                  capability:
                    'PLACE_SEARCH',

                  providers: [
                    'example',
                  ],
                },
              ],
            },

            registry,
          );

        const service =
          new CachedPlacesService({
            engine:
              new PlacesFallbackEngine({
                dispatcher:
                  new PlacesDispatcher({
                    registry,
                  }),

                selection,
              }),

            selection,

            cache:
              new InMemoryPlacesCacheStore(),
          });

        const first =
          service.search({
            query:
              'hospital',
          });

        const second =
          service.search({
            query:
              'hospital',
          });

        resolveProvider({
          providerName:
            'example',

          places: [],
        });

        const results =
          await Promise.all([
            first,
            second,
          ]);

        expect(search)
          .toHaveBeenCalledTimes(1);

        expect(
          results[1]
            .metadata
            .deduplicated,
        ).toBe(true);
      },
    );
  },
);
