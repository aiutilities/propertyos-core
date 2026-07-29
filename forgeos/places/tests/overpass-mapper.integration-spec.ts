import {
  mapOverpassElement,
} from '../index';

describe(
  'Overpass mapper',
  () => {
    it(
      'maps OSM nodes to normalized Places',
      () => {
        expect(
          mapOverpassElement(
            {
              type:
                'node',

              id:
                123,

              lat:
                13.083,

              lon:
                80.271,

              tags: {
                name:
                  'Example Hospital',

                amenity:
                  'hospital',

                phone:
                  '+91 44 0000 0000',

                opening_hours:
                  'Mo-Su 00:00-24:00',

                'addr:housenumber':
                  '10',

                'addr:street':
                  'Mount Road',

                'addr:city':
                  'Chennai',

                'addr:state':
                  'Tamil Nadu',

                'addr:postcode':
                  '600002',

                'addr:country':
                  'IN',
              },
            },

            {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            'overpass',
          ),
        ).toMatchObject({
          id:
            'node:123',

          providerName:
            'overpass',

          name:
            'Example Hospital',

          primaryCategory:
            'HOSPITAL',

          address: {
            formattedAddress:
              '10 Mount Road, Chennai, Tamil Nadu, 600002, IN',

            city:
              'Chennai',

            countryCode:
              'IN',
          },

          contact: {
            phone:
              '+91 44 0000 0000',
          },

          openingHours: {
            weekdayText: [
              'Mo-Su 00:00-24:00',
            ],
          },
        });
      },
    );

    it(
      'maps way centres',
      () => {
        expect(
          mapOverpassElement(
            {
              type:
                'way',

              id:
                456,

              center: {
                lat:
                  13,

                lon:
                  80,
              },

              tags: {
                name:
                  'Example Park',

                leisure:
                  'park',
              },
            },

            {
              latitude:
                13,

              longitude:
                80,
            },

            'overpass',
          ),
        ).toMatchObject({
          id:
            'way:456',

          primaryCategory:
            'PARK',

          distanceMeters:
            0,
        });
      },
    );

    it(
      'ignores elements without coordinates',
      () => {
        expect(
          mapOverpassElement(
            {
              type:
                'relation',

              id:
                999,

              tags: {
                name:
                  'Missing Location',
              },
            },

            {
              latitude:
                13,

              longitude:
                80,
            },

            'overpass',
          ),
        ).toBeUndefined();
      },
    );
  },
);
