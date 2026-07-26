import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PlatformRuntimeService,
} from './platform-runtime.service';

describe(
  'PlatformRuntimeService',
  () => {
    it(
      'resolves platform, API and build defaults centrally',
      () => {
        expect(
          PlatformRuntimeService
            .resolvePlatformVersion({}),
        ).toBe('0.1.0');

        expect(
          PlatformRuntimeService
            .resolveApiVersion({}),
        ).toBe('0.1.0');

        expect(
          PlatformRuntimeService
            .resolveBuildVersion({}),
        ).toBe('1.0.0');
      },
    );

    it(
      'allows environment overrides',
      () => {
        const environment = {
          PROPERTYOS_PLATFORM_VERSION:
            '3.0.0',
          API_VERSION:
            '2.0.0',
          BUILD_VERSION:
            '3.0.0-rc.1',
        };

        expect(
          PlatformRuntimeService
            .resolvePlatformVersion(
              environment,
            ),
        ).toBe('3.0.0');

        expect(
          PlatformRuntimeService
            .resolveApiVersion(
              environment,
            ),
        ).toBe('2.0.0');

        expect(
          PlatformRuntimeService
            .resolveBuildVersion(
              environment,
            ),
        ).toBe('3.0.0-rc.1');
      },
    );

    it(
      'returns immutable runtime information',
      () => {
        const runtime =
          new PlatformRuntimeService();

        expect(
          runtime.context(),
        ).toMatchObject({
          platformVersion:
            expect.any(String),
          apiVersion:
            expect.any(String),
          buildVersion:
            expect.any(String),
          environment:
            expect.any(String),
          nodeVersion:
            process.version,
          operatingSystem:
            expect.any(String),
          operatingSystemRelease:
            expect.any(String),
          architecture:
            expect.any(String),
        });
      },
    );
  },
);
