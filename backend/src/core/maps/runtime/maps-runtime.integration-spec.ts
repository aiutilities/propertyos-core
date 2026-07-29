import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MapsRuntimeService,
} from './maps-runtime.service';

describe(
  'MapsRuntimeService',
  () => {
    const originalEnvironment = {
      ...process.env,
    };

    const logger = {
      debug:
        jest.fn(),
      info:
        jest.fn(),
      warn:
        jest.fn(),
      error:
        jest.fn(),
    };

    afterEach(
      () => {
        process.env = {
          ...originalEnvironment,
        };

        jest.clearAllMocks();
      },
    );

    it(
      'initializes safely when disabled',
      () => {
        delete process.env
          .MAPS_ENABLED;

        const runtime =
          new MapsRuntimeService(
            logger as never,
          );

        expect(
          () =>
            runtime.onModuleInit(),
        ).not.toThrow();

        expect(
          runtime.isEnabled(),
        ).toBe(false);

        expect(
          runtime.health(),
        ).toMatchObject({
          enabled:
            false,
          providers: [],
          selection: [],
        });

        expect(
          () =>
            runtime.getService(),
        ).toThrow(
          'MAPS_RUNTIME_NOT_ENABLED',
        );
      },
    );

    it(
      'initializes Nominatim and OSRM when enabled',
      () => {
        process.env.MAPS_ENABLED =
          'true';

        process.env
          .MAPS_NOMINATIM_USER_AGENT =
          'PropertyOS/1.0 maps@example.com';

        process.env
          .MAPS_NOMINATIM_ENDPOINT =
          'https://nominatim.example.test';

        process.env
          .MAPS_OSRM_ENDPOINT =
          'https://osrm.example.test';

        const runtime =
          new MapsRuntimeService(
            logger as never,
          );

        runtime.onModuleInit();

        expect(
          runtime.isEnabled(),
        ).toBe(true);

        expect(
          runtime
            .getProviderRegistry()
            .list()
            .map(
              (provider) =>
                provider.name,
            ),
        ).toEqual([
          'nominatim',
          'osrm',
        ]);

        expect(
          runtime.getService(),
        ).toBeDefined();
      },
    );

    it(
      'fails closed for invalid enabled configuration',
      () => {
        process.env.MAPS_ENABLED =
          'true';

        delete process.env
          .MAPS_NOMINATIM_USER_AGENT;

        const runtime =
          new MapsRuntimeService(
            logger as never,
          );

        expect(
          () =>
            runtime.onModuleInit(),
        ).toThrow(
          'MAPS_RUNTIME_CONFIGURATION_BLOCKED',
        );
      },
    );
  },
);
