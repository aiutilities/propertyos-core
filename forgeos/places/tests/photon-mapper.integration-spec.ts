import {
  mapPhotonFeature,
} from '../index';

describe(
  'Photon mapper',
  () => {
    it(
      'maps GeoJSON features to normalized Places',
      () => {
        expect(
          mapPhotonFeature(
            {
              type:
                'Feature',

              geometry: {
                type:
                  'Point',

                coordinates: [
                  80.2707,
                  13.0827,
                ],
              },

              properties: {
                name:
                  'Example Hospital',

                street:
                  'Mount Road',

                housenumber:
                  '10',

                city:
                  'Chennai',

                state:
                  'Tamil Nadu',

                country:
                  'India',

                countrycode:
                  'IN',

                osm_key:
                  'amenity',

                osm_value:
                  'hospital',

                osm_type:
                  'N',

                osm_id:
                  123,
              },
            },

            'photon',
          ),
        ).toMatchObject({
          id:
            'N:123',

          providerName:
            'photon',

          name:
            'Example Hospital',

          coordinate: {
            latitude:
              13.0827,

            longitude:
              80.2707,
          },

          primaryCategory:
            'HOSPITAL',

          categories: [
            'HOSPITAL',
          ],

          address: {
            addressLine1:
              '10 Mount Road',

            city:
              'Chennai',

            countryCode:
              'IN',
          },
        });
      },
    );

    it(
      'falls back to OTHER for unknown categories',
      () => {
        expect(
          mapPhotonFeature(
            {
              type:
                'Feature',

              geometry: {
                type:
                  'Point',

                coordinates: [
                  80,
                  13,
                ],
              },

              properties: {
                name:
                  'Unknown POI',

                osm_key:
                  'custom',

                osm_value:
                  'unknown',
              },
            },

            'photon',
          ).primaryCategory,
        ).toBe(
          'OTHER',
        );
      },
    );
  },
);
