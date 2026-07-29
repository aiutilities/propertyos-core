import {
  calculateGeoDistanceMeters,
  createGeoBoundingBox,
  findNearbyPlaces,
  isCoordinateInsidePolygon,
  validateGeoCoordinate,
} from '../index';

describe(
  'ForgeOS Maps geometry',
  () => {
    it(
      'validates geographic coordinates',
      () => {
        expect(
          validateGeoCoordinate({
            latitude:
              13.0827,

            longitude:
              80.2707,
          }),
        ).toEqual({
          valid:
            true,

          errors: [],
        });

        expect(
          validateGeoCoordinate({
            latitude:
              100,

            longitude:
              200,
          }).errors,
        ).toHaveLength(2);
      },
    );

    it(
      'calculates Chennai to Bengaluru distance',
      () => {
        const distance =
          calculateGeoDistanceMeters(
            {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            {
              latitude:
                12.9716,

              longitude:
                77.5946,
            },
          );

        expect(distance)
          .toBeGreaterThan(
            280_000,
          );

        expect(distance)
          .toBeLessThan(
            310_000,
          );
      },
    );

    it(
      'creates a bounding box around a coordinate',
      () => {
        const bounds =
          createGeoBoundingBox(
            {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            1_000,
          );

        expect(
          bounds.southWest
            .latitude,
        ).toBeLessThan(
          13.0827,
        );

        expect(
          bounds.northEast
            .longitude,
        ).toBeGreaterThan(
          80.2707,
        );
      },
    );

    it(
      'detects polygon containment and holes',
      () => {
        const polygon = {
          exterior: [
            {
              latitude:
                10,

              longitude:
                10,
            },
            {
              latitude:
                10,

              longitude:
                20,
            },
            {
              latitude:
                20,

              longitude:
                20,
            },
            {
              latitude:
                20,

              longitude:
                10,
            },
          ],

          holes: [
            [
              {
                latitude:
                  14,

                longitude:
                  14,
              },
              {
                latitude:
                  14,

                longitude:
                  16,
              },
              {
                latitude:
                  16,

                longitude:
                  16,
              },
              {
                latitude:
                  16,

                longitude:
                  14,
              },
            ],
          ],
        };

        expect(
          isCoordinateInsidePolygon(
            {
              latitude:
                12,

              longitude:
                12,
            },

            polygon,
          ),
        ).toBe(true);

        expect(
          isCoordinateInsidePolygon(
            {
              latitude:
                15,

              longitude:
                15,
            },

            polygon,
          ),
        ).toBe(false);

        expect(
          isCoordinateInsidePolygon(
            {
              latitude:
                25,

              longitude:
                25,
            },

            polygon,
          ),
        ).toBe(false);
      },
    );

    it(
      'sorts and limits nearby places',
      () => {
        const places =
          findNearbyPlaces({
            center: {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            limit:
              2,

            places: [
              {
                id:
                  'far',

                providerName:
                  'local',

                coordinate: {
                  latitude:
                    12.9716,

                  longitude:
                    77.5946,
                },

                address: {
                  formattedAddress:
                    'Bengaluru',
                },
              },

              {
                id:
                  'near',

                providerName:
                  'local',

                coordinate: {
                  latitude:
                    13.083,

                  longitude:
                    80.271,
                },

                address: {
                  formattedAddress:
                    'Chennai nearby',
                },
              },

              {
                id:
                  'middle',

                providerName:
                  'local',

                coordinate: {
                  latitude:
                    13.05,

                  longitude:
                    80.25,
                },

                address: {
                  formattedAddress:
                    'Chennai',
                },
              },
            ],
          });

        expect(
          places.map(
            (place) =>
              place.id,
          ),
        ).toEqual([
          'near',
          'middle',
        ]);

        expect(
          places[0]
            .distanceMeters,
        ).toBeLessThan(
          places[1]
            .distanceMeters,
        );
      },
    );
  },
);
