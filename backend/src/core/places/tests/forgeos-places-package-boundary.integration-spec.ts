import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  OverpassProvider,
  PhotonProvider,
  PlacesFallbackEngine,
  PlacesProviderRegistry,
  PlacesProviderSelection,
  WikidataProvider,
} from '@forgeos/places';

describe(
  'ForgeOS Places package boundary',
  () => {
    it(
      'exports the runtime primitives required by PropertyOS',
      () => {
        expect(
          typeof PlacesProviderRegistry,
        ).toBe(
          'function',
        );

        expect(
          typeof PlacesProviderSelection,
        ).toBe(
          'function',
        );

        expect(
          typeof PlacesFallbackEngine,
        ).toBe(
          'function',
        );

        expect(
          typeof PhotonProvider,
        ).toBe(
          'function',
        );

        expect(
          typeof OverpassProvider,
        ).toBe(
          'function',
        );

        expect(
          typeof WikidataProvider,
        ).toBe(
          'function',
        );
      },
    );
  },
);
