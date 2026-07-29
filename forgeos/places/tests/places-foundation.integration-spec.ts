import {
  PLACE_CATEGORIES,
  PlacesDispatcher,
  PlacesProviderRegistry,
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
