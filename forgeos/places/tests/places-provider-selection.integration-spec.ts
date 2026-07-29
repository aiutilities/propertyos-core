import {
  PlacesProviderRegistry,
  PlacesProviderSelection,
  PlacesProviderSelectionError,
} from '../index';

describe(
  'PlacesProviderSelection',
  () => {
    it(
      'returns configured providers in order',
      () => {
        const registry =
          new PlacesProviderRegistry();

        for (
          const name of
            [
              'primary',
              'fallback',
            ]
        ) {
          registry.register({
            name,

            capabilities: [
              'PLACE_SEARCH',
            ],
          });
        }

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

        expect(
          selection
            .select(
              'PLACE_SEARCH',
            )
            .providers,
        ).toEqual([
          'primary',
          'fallback',
        ]);
      },
    );

    it(
      'fails when no usable provider exists',
      () => {
        const selection =
          new PlacesProviderSelection(
            {
              rules: [
                {
                  capability:
                    'PLACE_SEARCH',

                  providers: [
                    'missing',
                  ],
                },
              ],
            },

            new PlacesProviderRegistry(),
          );

        expect(
          () =>
            selection.select(
              'PLACE_SEARCH',
            ),
        ).toThrow(
          PlacesProviderSelectionError,
        );
      },
    );
  },
);
