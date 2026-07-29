import {
  MapsProviderCapabilityNotSupportedError,
  MapsProviderNotFoundError,
  MapsProviderRegistry,
} from '../index';

describe(
  'MapsProviderRegistry',
  () => {
    it(
      'registers and requires a provider',
      () => {
        const registry =
          new MapsProviderRegistry();

        const provider = {
          name:
            'openstreetmap',

          capabilities: [
            'GEOCODING',
            'REVERSE_GEOCODING',
          ] as const,
        };

        registry.register(
          provider,
        );

        expect(
          registry.has(
            'openstreetmap',
          ),
        ).toBe(true);

        expect(
          registry.require(
            'openstreetmap',
          ),
        ).toBe(
          provider,
        );

        expect(
          registry.list(),
        ).toEqual([
          provider,
        ]);
      },
    );

    it(
      'requires a declared capability',
      () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'geocoder',

          capabilities: [
            'GEOCODING',
          ],
        });

        expect(
          registry.requireCapability(
            'geocoder',
            'GEOCODING',
          ).name,
        ).toBe(
          'geocoder',
        );

        expect(
          () =>
            registry
              .requireCapability(
                'geocoder',
                'ROUTING',
              ),
        ).toThrow(
          MapsProviderCapabilityNotSupportedError,
        );
      },
    );

    it(
      'fails clearly for an unknown provider',
      () => {
        const registry =
          new MapsProviderRegistry();

        expect(
          () =>
            registry.require(
              'missing',
            ),
        ).toThrow(
          MapsProviderNotFoundError,
        );
      },
    );

    it(
      'supports unregister and clear',
      () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'one',

          capabilities: [],
        });

        expect(
          registry.unregister(
            'one',
          ),
        ).toBe(true);

        registry.register({
          name:
            'two',

          capabilities: [],
        });

        registry.clear();

        expect(
          registry.list(),
        ).toEqual([]);
      },
    );
  },
);
