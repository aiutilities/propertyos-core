import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  resolvePropertyOSMapsRuntimeConfiguration,
} from './maps-runtime.configuration';

describe(
  'PropertyOS Maps runtime configuration',
  () => {
    const originalEnvironment = {
      ...process.env,
    };

    afterEach(
      () => {
        process.env = {
          ...originalEnvironment,
        };
      },
    );

    it(
      'is disabled safely by default',
      () => {
        delete process.env
          .MAPS_ENABLED;

        expect(
          resolvePropertyOSMapsRuntimeConfiguration(),
        ).toMatchObject({
          enabled:
            false,

          errors: [],
        });
      },
    );

    it(
      'requires a Nominatim user agent when enabled',
      () => {
        process.env.MAPS_ENABLED =
          'true';

        delete process.env
          .MAPS_NOMINATIM_USER_AGENT;

        expect(
          resolvePropertyOSMapsRuntimeConfiguration()
            .errors,
        ).toContain(
          'MAPS_NOMINATIM_USER_AGENT is required when Maps is enabled',
        );
      },
    );

    it(
      'parses provider order and cache size',
      () => {
        process.env.MAPS_ENABLED =
          'true';

        process.env
          .MAPS_NOMINATIM_USER_AGENT =
          'PropertyOS/1.0 maps@example.com';

        process.env
          .MAPS_CACHE_MAX_ENTRIES =
          '250';

        expect(
          resolvePropertyOSMapsRuntimeConfiguration(),
        ).toMatchObject({
          enabled:
            true,

          cacheMaximumEntries:
            250,

          geocodeProviders: [
            'nominatim',
          ],

          routingProviders: [
            'osrm',
          ],

          errors: [],
        });
      },
    );
  },
);
