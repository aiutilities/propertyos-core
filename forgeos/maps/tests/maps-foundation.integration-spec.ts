import {
  NoopMapsLogger,
} from '../index';

describe(
  'ForgeOS Maps foundation',
  () => {
    it(
      'exports runtime contracts and geometry utilities',
      async () => {
        const maps =
          await import(
            '../index'
          );

        expect(
          typeof maps
            .MapsProviderRegistry,
        ).toBe(
          'function',
        );

        expect(
          typeof maps
            .MapsDispatcher,
        ).toBe(
          'function',
        );


        expect(
          typeof maps
            .calculateGeoDistanceMeters,
        ).toBe(
          'function',
        );

        expect(
          typeof maps
            .createGeoBoundingBox,
        ).toBe(
          'function',
        );

        expect(
          typeof maps
            .findNearbyPlaces,
        ).toBe(
          'function',
        );

        expect(
          typeof maps
            .isCoordinateInsidePolygon,
        ).toBe(
          'function',
        );
      },
    );

    it(
      'provides a no-operation logger',
      () => {
        const logger =
          new NoopMapsLogger();

        expect(
          () => {
            logger.debug(
              'debug',
            );

            logger.info(
              'info',
            );

            logger.warn(
              'warn',
            );

            logger.error(
              'error',
            );
          },
        ).not.toThrow();
      },
    );
  },
);
