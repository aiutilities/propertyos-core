import {
  PlacesRequestValidationError,
  validatePlaceDetailsRequest,
  validatePlaceNearbyRequest,
  validatePlaceSearchRequest,
} from '../index';

describe(
  'Places request validation',
  () => {
    it(
      'accepts valid search requests',
      () => {
        expect(
          () =>
            validatePlaceSearchRequest({
              query:
                'hospital',

              coordinateBias: {
                latitude:
                  13.0827,

                longitude:
                  80.2707,
              },

              radiusMeters:
                5000,

              categories: [
                'HOSPITAL',
              ],

              limit:
                20,
            }),
        ).not.toThrow();
      },
    );

    it(
      'rejects invalid nearby coordinates and radius',
      () => {
        expect(
          () =>
            validatePlaceNearbyRequest({
              coordinate: {
                latitude:
                  200,

                longitude:
                  80,
              },

              radiusMeters:
                0,
            }),
        ).toThrow(
          PlacesRequestValidationError,
        );
      },
    );

    it(
      'rejects unsupported categories',
      () => {
        expect(
          () =>
            validatePlaceSearchRequest({
              query:
                'example',

              categories: [
                'NOT_REAL',
              ] as never,
            }),
        ).toThrow(
          PlacesRequestValidationError,
        );
      },
    );

    it(
      'requires a place ID for details',
      () => {
        expect(
          () =>
            validatePlaceDetailsRequest({
              placeId:
                '',
            }),
        ).toThrow(
          PlacesRequestValidationError,
        );
      },
    );
  },
);
