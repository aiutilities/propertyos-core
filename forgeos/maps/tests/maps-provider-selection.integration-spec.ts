import {
  MapsProviderRegistry,
  MapsProviderSelection,
  MapsProviderSelectionInvalidError,
  MapsProviderSelectionNotConfiguredError,
} from '../index';

describe(
  'MapsProviderSelection',
  () => {
    it(
      'returns providers in configured order',
      () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'primary',

          capabilities: [
            'GEOCODING',
          ],
        });

        registry.register({
          name:
            'fallback',

          capabilities: [
            'GEOCODING',
          ],
        });

        const selection =
          new MapsProviderSelection(
            {
              rules: [
                {
                  capability:
                    'GEOCODING',

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
          selection.select(
            'GEOCODING',
          ),
        ).toEqual({
          capability:
            'GEOCODING',

          providers: [
            'primary',
            'fallback',
          ],
        });
      },
    );

    it(
      'rejects unknown or incapable providers',
      () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'routing-only',

          capabilities: [
            'ROUTING',
          ],
        });

        expect(
          () =>
            new MapsProviderSelection(
              {
                rules: [
                  {
                    capability:
                      'GEOCODING',

                    providers: [
                      'routing-only',
                      'missing',
                    ],
                  },
                ],
              },

              registry,
            ),
        ).toThrow(
          MapsProviderSelectionInvalidError,
        );
      },
    );

    it(
      'rejects duplicate capability rules',
      () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'one',

          capabilities: [
            'GEOCODING',
          ],
        });

        expect(
          () =>
            new MapsProviderSelection(
              {
                rules: [
                  {
                    capability:
                      'GEOCODING',

                    providers: [
                      'one',
                    ],
                  },
                  {
                    capability:
                      'GEOCODING',

                    providers: [
                      'one',
                    ],
                  },
                ],
              },

              registry,
            ),
        ).toThrow(
          MapsProviderSelectionInvalidError,
        );
      },
    );

    it(
      'fails clearly when a capability is not configured',
      () => {
        const registry =
          new MapsProviderRegistry();

        const selection =
          new MapsProviderSelection(
            {
              rules: [],
            },

            registry,
          );

        expect(
          () =>
            selection.select(
              'ROUTING',
            ),
        ).toThrow(
          MapsProviderSelectionNotConfiguredError,
        );
      },
    );
  },
);
