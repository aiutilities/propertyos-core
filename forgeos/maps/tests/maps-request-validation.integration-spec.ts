import {
  MapsRequestValidationError,
  validateGeocodeRequest,
  validateNearbySearchRequest,
  validateReverseGeocodeRequest,
  validateRouteRequest,
} from '../index';

describe(
  'ForgeOS Maps request validation',
  () => {
    it(
      'accepts valid requests',
      () => {
        expect(
          () =>
            validateGeocodeRequest({
              query:
                'Chennai Central',
              countryCode:
                'IN',
              limit:
                5,
            }),
        ).not.toThrow();

        expect(
          () =>
            validateReverseGeocodeRequest({
              coordinate: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
            }),
        ).not.toThrow();

        expect(
          () =>
            validateRouteRequest({
              origin: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
              destination: {
                latitude:
                  12.9716,
                longitude:
                  77.5946,
              },
              travelMode:
                'DRIVING',
            }),
        ).not.toThrow();

        expect(
          () =>
            validateNearbySearchRequest({
              center: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
              radiusMeters:
                5000,
              query:
                'hospital',
            }),
        ).not.toThrow();
      },
    );

    it(
      'rejects an empty geocode query',
      () => {
        expect(
          () =>
            validateGeocodeRequest({
              query:
                ' ',
            }),
        ).toThrow(
          MapsRequestValidationError,
        );
      },
    );

    it(
      'rejects invalid coordinates',
      () => {
        expect(
          () =>
            validateReverseGeocodeRequest({
              coordinate: {
                latitude:
                  100,
                longitude:
                  200,
              },
            }),
        ).toThrow(
          MapsRequestValidationError,
        );
      },
    );

    it(
      'rejects excessive nearby radius',
      () => {
        expect(
          () =>
            validateNearbySearchRequest({
              center: {
                latitude:
                  13,
                longitude:
                  80,
              },
              radiusMeters:
                100001,
            }),
        ).toThrow(
          MapsRequestValidationError,
        );
      },
    );

    it(
      'rejects invalid route departure time',
      () => {
        expect(
          () =>
            validateRouteRequest({
              origin: {
                latitude:
                  13,
                longitude:
                  80,
              },
              destination: {
                latitude:
                  12,
                longitude:
                  77,
              },
              departureTime:
                'not-a-date',
            }),
        ).toThrow(
          MapsRequestValidationError,
        );
      },
    );
  },
);
