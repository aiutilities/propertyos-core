import { describe, expect, it } from '@jest/globals';

import {
  PROPERTYOS_AI_SDK_VERSION,
  PropertyOsAiSdkError,
  PropertyOsAiSdkService,
} from '../index';

describe(
  'PropertyOS AI SDK public API',
  () => {
    it(
      'exports the stable SDK version',
      () => {
        expect(
          PROPERTYOS_AI_SDK_VERSION,
        ).toBe('1.0.0');
      },
    );

    it(
      'exports the SDK service',
      () => {
        expect(
          PropertyOsAiSdkService,
        ).toBeDefined();

        expect(
          typeof PropertyOsAiSdkService,
        ).toBe('function');
      },
    );

    it(
      'exports the standard SDK error',
      () => {
        const error =
          new PropertyOsAiSdkError(
            'PROVIDER_TIMEOUT',
            'Provider timed out',
            true,
            'corr-public-api',
            {
              providerName:
                'mock',
            },
          );

        expect(error).toEqual(
          expect.objectContaining({
            name:
              'PropertyOsAiSdkError',
            code:
              'PROVIDER_TIMEOUT',
            message:
              'Provider timed out',
            retriable:
              true,
            correlationId:
              'corr-public-api',
            details: {
              providerName:
                'mock',
            },
          }),
        );
      },
    );
  },
);
