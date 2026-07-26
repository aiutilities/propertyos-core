import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Request,
} from 'express';

import {
  PlatformIdempotencyFingerprintService,
} from '../services/platform-idempotency-fingerprint.service';
import {
  PlatformAuthenticatedHttpRequest,
  PlatformIdempotencyContextBuilder,
} from './platform-idempotency-context-builder.service';

const request = (
  overrides:
    Partial<
      PlatformAuthenticatedHttpRequest
    > = {},
): PlatformAuthenticatedHttpRequest =>
  ({
    method:
      'POST',
    params: {
      slug:
        'example',
      version:
        '1.0.0',
    },
    query: {},
    body: {
      autoEnable:
        true,
    },
    headers: {},
    user: {
      sub:
        'actor-1',
    },
    ...overrides,
  } as unknown as
    PlatformAuthenticatedHttpRequest);

describe(
  'PlatformIdempotencyContextBuilder',
  () => {
    const builder =
      new PlatformIdempotencyContextBuilder(
        new PlatformIdempotencyFingerprintService(),
      );

    const options = {
      operation:
        'platform.test.execute',
      required:
        true,
      expiresInSeconds:
        300,
      resource:
        (
          input: Request,
        ) =>
          `resource:${input.params.slug}@${input.params.version}`,
    };

    it(
      'builds an actor-scoped canonical request',
      () => {
        const result =
          builder.build(
            request(),
            options,
            'request-key-0001',
          );

        expect(
          result,
        ).toMatchObject({
          actorId:
            'actor-1',
          operation:
            'platform.test.execute',
          resourceKey:
            'resource:example@1.0.0',
          idempotencyKey:
            'request-key-0001',
        });

        expect(
          result.requestFingerprint,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );

        expect(
          result.expiresAt.getTime(),
        ).toBeGreaterThan(
          Date.now(),
        );
      },
    );

    it(
      'produces the same fingerprint for reordered body keys',
      () => {
        const left =
          builder.build(
            request({
              body: {
                one: 1,
                two: 2,
              },
            }),
            options,
            'request-key-0002',
          );

        const right =
          builder.build(
            request({
              body: {
                two: 2,
                one: 1,
              },
            }),
            options,
            'request-key-0003',
          );

        expect(
          left.requestFingerprint,
        ).toBe(
          right.requestFingerprint,
        );
      },
    );

    it(
      'changes the fingerprint when request data changes',
      () => {
        const left =
          builder.build(
            request({
              body: {
                version:
                  '1.0.0',
              },
            }),
            options,
            'request-key-0004',
          );

        const right =
          builder.build(
            request({
              body: {
                version:
                  '2.0.0',
              },
            }),
            options,
            'request-key-0004',
          );

        expect(
          left.requestFingerprint,
        ).not.toBe(
          right.requestFingerprint,
        );
      },
    );

    it(
      'rejects a request without an authenticated actor',
      () => {
        expect(
          () =>
            builder.build(
              request({
                user:
                  undefined,
              }),
              options,
              'request-key-0005',
            ),
        ).toThrow(
          UnauthorizedException,
        );
      },
    );

    it(
      'rejects an invalid expiry',
      () => {
        expect(
          () =>
            builder.build(
              request(),
              {
                ...options,
                expiresInSeconds:
                  10,
              },
              'request-key-0006',
            ),
        ).toThrow(
          BadRequestException,
        );
      },
    );
  },
);
