import 'reflect-metadata';

import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  HttpStatus,
} from '@nestjs/common';
import {
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';
import {
  Response,
} from 'express';

import {
  HealthController,
} from './health.controller';
import {
  HealthService,
} from './health.service';

const createResponse = () => {
  const statusCodes: number[] = [];

  const response = {
    status(
      code: number,
    ) {
      statusCodes.push(code);
      return this;
    },
  } as unknown as Response;

  return {
    response,
    statusCodes,
  };
};

describe(
  'Health readiness semantics',
  () => {
    it(
      'returns healthy readiness without forcing an error status',
      async () => {
        const readiness = {
          status:
            'ok',
          service:
            'propertyos-api',
          checks: {
            database: {
              status:
                'ok',
            },
          },
        };

        const service = {
          getReadiness:
            async () => readiness,
        } as unknown as HealthService;

        const controller =
          new HealthController(
            service,
          );

        const {
          response,
          statusCodes,
        } = createResponse();

        await expect(
          controller.getReadiness(
            response,
          ),
        ).resolves.toBe(
          readiness,
        );

        expect(
          statusCodes,
        ).toEqual([]);
      },
    );

    it(
      'returns HTTP 503 for degraded readiness',
      async () => {
        const readiness = {
          status:
            'degraded',
          service:
            'propertyos-api',
          checks: {
            database: {
              status:
                'error',
            },
          },
        };

        const service = {
          getReadiness:
            async () => readiness,
        } as unknown as HealthService;

        const controller =
          new HealthController(
            service,
          );

        const {
          response,
          statusCodes,
        } = createResponse();

        await expect(
          controller.getReadiness(
            response,
          ),
        ).resolves.toBe(
          readiness,
        );

        expect(
          statusCodes,
        ).toEqual([
          HttpStatus.SERVICE_UNAVAILABLE,
        ]);
      },
    );

    it(
      'binds Docker and Compose health checks to readiness',
      () => {
        const backendRoot = resolve(
          __dirname,
          '../../..',
        );

        const dockerfile =
          readFileSync(
            resolve(
              backendRoot,
              'Dockerfile',
            ),
            'utf8',
          );

        const compose =
          readFileSync(
            resolve(
              backendRoot,
              'docker-compose.yml',
            ),
            'utf8',
          );

        expect(dockerfile).toContain(
          '/api/v1/health/ready',
        );

        expect(dockerfile).toContain(
          "b.status==='ok'",
        );

        expect(compose).toContain(
          '/api/v1/health/ready',
        );

        expect(compose).not.toContain(
          "fetch('http://127.0.0.1:3000/api/v1/health')",
        );
      },
    );
  },
);
