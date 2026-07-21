import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AiExecutionContextService,
} from './ai-execution-context.service';

describe(
  'AiExecutionContextService',
  () => {
    let service:
      AiExecutionContextService;

    beforeEach(
      () => {
        service =
          new AiExecutionContextService();
      },
    );

    const createInput =
      () => ({
        tenantId:
          'tenant-1',
        requestId:
          'request-1',
        correlationId:
          'correlation-1',
        executionId:
          'execution-1',
        attempt:
          2,
        capability:
          'TEXT_GENERATION' as const,
        classification:
          'CONFIDENTIAL' as const,
        executionMode:
          'ISOLATED' as const,
        timeoutMs:
          30_000,
        metadata: {
          source:
            'orchestrator',
          nested: {
            value:
              true,
          },
        },
        timestamps: {
          createdAt:
            '2026-07-21T10:00:00.000Z',
          startedAt:
            '2026-07-21T10:00:01.000Z',
        },
      });

    it(
      'creates the canonical execution context',
      () => {
        const context =
          service.create(
            createInput(),
          );

        expect(context)
          .toEqual({
            tenantId:
              'tenant-1',
            requestId:
              'request-1',
            correlationId:
              'correlation-1',
            executionId:
              'execution-1',
            attempt:
              2,
            capability:
              'TEXT_GENERATION',
            classification:
              'CONFIDENTIAL',
            executionMode:
              'ISOLATED',
            timeoutMs:
              30_000,
            metadata: {
              source:
                'orchestrator',
              nested: {
                value:
                  true,
              },
            },
            timestamps: {
              createdAt:
                '2026-07-21T10:00:00.000Z',
              startedAt:
                '2026-07-21T10:00:01.000Z',
            },
          });
      },
    );

    it(
      'freezes the context and nested values',
      () => {
        const context =
          service.create(
            createInput(),
          );

        expect(
          Object.isFrozen(
            context,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            context.metadata,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            context.metadata
              .nested,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            context.timestamps,
          ),
        ).toBe(true);
      },
    );

    it(
      'clones metadata before freezing it',
      () => {
        const input =
          createInput();

        const context =
          service.create(
            input,
          );

        (
          input.metadata
            .nested as {
              value: boolean;
            }
        ).value =
          false;

        expect(
          (
            context.metadata
              .nested as {
                value: boolean;
              }
          ).value,
        ).toBe(true);
      },
    );

    it(
      'normalizes supplied identifiers',
      () => {
        const input =
          createInput();

        const context =
          service.create({
            ...input,
            tenantId:
              ' tenant-1 ',
            requestId:
              ' request-1 ',
            correlationId:
              ' correlation-1 ',
            executionId:
              ' execution-1 ',
          });

        expect(
          context.tenantId,
        ).toBe(
          'tenant-1',
        );

        expect(
          context.requestId,
        ).toBe(
          'request-1',
        );

        expect(
          context.correlationId,
        ).toBe(
          'correlation-1',
        );

        expect(
          context.executionId,
        ).toBe(
          'execution-1',
        );
      },
    );

    it(
      'generates missing execution identifiers',
      () => {
        const input =
          createInput();

        const context =
          service.create({
            ...input,
            requestId:
              undefined,
            correlationId:
              undefined,
            executionId:
              undefined,
          });

        expect(
          context.requestId,
        ).toBeTruthy();

        expect(
          context.correlationId,
        ).toBeTruthy();

        expect(
          context.executionId,
        ).toBeTruthy();
      },
    );

    it.each([
      0,
      -1,
      1.5,
    ])(
      'rejects invalid attempt %p',
      attempt => {
        expect(
          () =>
            service.create({
              ...createInput(),
              attempt,
            }),
        ).toThrow(
          'attempt must be a positive integer',
        );
      },
    );

    it.each([
      0,
      -1,
      1.5,
    ])(
      'rejects invalid timeout %p',
      timeoutMs => {
        expect(
          () =>
            service.create({
              ...createInput(),
              timeoutMs,
            }),
        ).toThrow(
          'timeoutMs must be a positive integer',
        );
      },
    );

    it(
      'rejects invalid timestamps',
      () => {
        expect(
          () =>
            service.create({
              ...createInput(),
              timestamps: {
                createdAt:
                  'not-a-date',
              },
            }),
        ).toThrow(
          'createdAt must be a valid timestamp',
        );
      },
    );
  },
);
