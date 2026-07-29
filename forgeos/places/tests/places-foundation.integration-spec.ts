import {
  PLACE_CATEGORIES,
  CachedPlacesService,
  InMemoryPlacesCacheStore,
  PlacesDispatcher,
  PlacesFallbackEngine,
  PlacesProviderRegistry,
  OverpassProvider,
  PhotonProvider,
  PlacesProviderSelection,
  validatePlaceSearchRequest,
} from '../index';

describe(
  'ForgeOS Places foundation',
  () => {
    it(
      'exports the foundational runtime',
      () => {
        expect(
          typeof PlacesDispatcher,
        ).toBe(
          'function',
        );

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
          typeof PlacesFallbackEngine,
        ).toBe(
          'function',
        );

        expect(
          typeof CachedPlacesService,
        ).toBe(
          'function',
        );

        expect(
          typeof InMemoryPlacesCacheStore,
        ).toBe(
          'function',
        );

        expect(
          typeof validatePlaceSearchRequest,
        ).toBe(
          'function',
        );

        expect(
          PLACE_CATEGORIES,
        ).toContain(
          'HOSPITAL',
        );

        expect(
          PLACE_CATEGORIES,
        ).toContain(
          'RESTAURANT',
        );
      },
    );
  },
);
