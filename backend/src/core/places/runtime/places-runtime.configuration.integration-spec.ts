import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PhotonProvider,
  OverpassProvider,
  WikidataProvider,
} from '@forgeos/places';

import {
  createPlacesRuntimeConfiguration,
} from './places-runtime.configuration';

describe(
  'Places runtime configuration',
  () => {
    it(
      'creates the PropertyOS provider set',
      () => {
        const configuration =
          createPlacesRuntimeConfiguration();

        expect(
          configuration.searchProvider,
        ).toBeInstanceOf(
          PhotonProvider,
        );

        expect(
          configuration.nearbyProvider,
        ).toBeInstanceOf(
          OverpassProvider,
        );

        expect(
          configuration.detailsProvider,
        ).toBeInstanceOf(
          WikidataProvider,
        );
      },
    );

    it(
      'keeps provider capabilities separated',
      () => {
        const configuration =
          createPlacesRuntimeConfiguration();

        expect(
          configuration
            .searchProvider
            .capabilities,
        ).toEqual([
          'PLACE_SEARCH',
        ]);

        expect(
          configuration
            .nearbyProvider
            .capabilities,
        ).toEqual([
          'NEARBY_SEARCH',
        ]);

        expect(
          configuration
            .detailsProvider
            .capabilities,
        ).toEqual([
          'PLACE_DETAILS',
        ]);
      },
    );
  },
);
