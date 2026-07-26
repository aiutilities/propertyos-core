import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PlatformIdempotencyFingerprintService,
} from './platform-idempotency-fingerprint.service';

describe(
  'PlatformIdempotencyFingerprintService',
  () => {
    const service =
      new PlatformIdempotencyFingerprintService();

    it(
      'produces a lowercase SHA-256 digest',
      () => {
        expect(
          service.fingerprint({
            value: 1,
          }),
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );
      },
    );

    it(
      'is stable across object key order',
      () => {
        expect(
          service.fingerprint({
            a: 1,
            b: {
              c: 2,
              d: 3,
            },
          }),
        ).toBe(
          service.fingerprint({
            b: {
              d: 3,
              c: 2,
            },
            a: 1,
          }),
        );
      },
    );

    it(
      'preserves array order',
      () => {
        expect(
          service.fingerprint([
            1,
            2,
          ]),
        ).not.toBe(
          service.fingerprint([
            2,
            1,
          ]),
        );
      },
    );

    it(
      'normalizes undefined object values',
      () => {
        expect(
          service.fingerprint({
            value:
              undefined,
          }),
        ).toBe(
          service.fingerprint({
            value:
              null,
          }),
        );
      },
    );
  },
);
