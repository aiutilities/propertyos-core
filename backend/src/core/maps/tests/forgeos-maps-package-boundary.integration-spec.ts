import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  CachedMapsService,
  MapsDispatcher,
  MapsFallbackEngine,
  MapsProviderRegistry,
  NominatimProvider,
  OsrmProvider,
} from '@forgeos/maps';

describe(
  '@forgeos/maps package boundary',
  () => {
    it(
      'exposes the required runtime classes',
      () => {
        expect(
          typeof CachedMapsService,
        ).toBe(
          'function',
        );

        expect(
          typeof MapsDispatcher,
        ).toBe(
          'function',
        );

        expect(
          typeof MapsFallbackEngine,
        ).toBe(
          'function',
        );

        expect(
          typeof MapsProviderRegistry,
        ).toBe(
          'function',
        );

        expect(
          typeof NominatimProvider,
        ).toBe(
          'function',
        );

        expect(
          typeof OsrmProvider,
        ).toBe(
          'function',
        );
      },
    );
  },
);
