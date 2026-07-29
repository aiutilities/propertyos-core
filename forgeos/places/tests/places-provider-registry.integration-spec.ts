import {
  PlacesProviderAlreadyRegisteredError,
  PlacesProviderNotFoundError,
  PlacesProviderRegistry,
} from '../index';

describe(
  'PlacesProviderRegistry',
  () => {
    it(
      'registers and retrieves providers',
      () => {
        const registry =
          new PlacesProviderRegistry();

        registry.register({
          name:
            'example',

          capabilities: [
            'PLACE_SEARCH',
          ],
        });

        expect(
          registry.require(
            'example',
          ).name,
        ).toBe(
          'example',
        );

        expect(
          registry.listByCapability(
            'PLACE_SEARCH',
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'rejects duplicate registrations',
      () => {
        const registry =
          new PlacesProviderRegistry();

        const provider = {
          name:
            'example',

          capabilities: [
            'PLACE_SEARCH',
          ] as const,
        };

        registry.register(
          provider,
        );

        expect(
          () =>
            registry.register(
              provider,
            ),
        ).toThrow(
          PlacesProviderAlreadyRegisteredError,
        );
      },
    );

    it(
      'fails clearly for unknown providers',
      () => {
        const registry =
          new PlacesProviderRegistry();

        expect(
          () =>
            registry.require(
              'missing',
            ),
        ).toThrow(
          PlacesProviderNotFoundError,
        );
      },
    );
  },
);
