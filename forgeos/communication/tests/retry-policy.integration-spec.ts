import {
  CommunicationRetryEvaluator,
  validateRetryPolicy,
} from '../index';

describe(
  'CommunicationRetryEvaluator',
  () => {
    it(
      'calculates exponential backoff',
      () => {
        const evaluator =
          new CommunicationRetryEvaluator({
            maximumAttempts: 4,
            initialDelayMilliseconds:
              1000,
            backoffMultiplier: 2,
          });

        expect(
          evaluator.evaluate({
            attemptNumber: 1,
            retryable: true,
          }),
        ).toEqual({
          shouldRetry: true,
          nextAttemptNumber: 2,
          delayMilliseconds: 1000,
          reason:
            'RETRY_ALLOWED',
        });

        expect(
          evaluator.evaluate({
            attemptNumber: 2,
            retryable: true,
          }),
        ).toEqual({
          shouldRetry: true,
          nextAttemptNumber: 3,
          delayMilliseconds: 2000,
          reason:
            'RETRY_ALLOWED',
        });
      },
    );

    it(
      'caps the calculated delay',
      () => {
        const evaluator =
          new CommunicationRetryEvaluator({
            maximumAttempts: 5,
            initialDelayMilliseconds:
              1000,
            backoffMultiplier: 3,
            maximumDelayMilliseconds:
              2500,
          });

        expect(
          evaluator.evaluate({
            attemptNumber: 3,
            retryable: true,
          }),
        ).toMatchObject({
          shouldRetry: true,
          delayMilliseconds: 2500,
        });
      },
    );

    it(
      'stops when attempts are exhausted',
      () => {
        const evaluator =
          new CommunicationRetryEvaluator({
            maximumAttempts: 3,
            initialDelayMilliseconds:
              1000,
            backoffMultiplier: 2,
          });

        expect(
          evaluator.evaluate({
            attemptNumber: 3,
            retryable: true,
          }),
        ).toEqual({
          shouldRetry: false,
          reason:
            'ATTEMPTS_EXHAUSTED',
        });
      },
    );

    it(
      'rejects provider-declared non-retryable failures',
      () => {
        const evaluator =
          new CommunicationRetryEvaluator({
            maximumAttempts: 3,
            initialDelayMilliseconds:
              1000,
            backoffMultiplier: 2,
          });

        expect(
          evaluator.evaluate({
            attemptNumber: 1,
            retryable: false,
          }),
        ).toEqual({
          shouldRetry: false,
          reason:
            'PROVIDER_NOT_RETRYABLE',
        });
      },
    );

    it(
      'restricts retries by error code',
      () => {
        const evaluator =
          new CommunicationRetryEvaluator({
            maximumAttempts: 3,
            initialDelayMilliseconds:
              1000,
            backoffMultiplier: 2,
            retryableErrorCodes: [
              'RATE_LIMITED',
              'PROVIDER_UNAVAILABLE',
            ],
          });

        expect(
          evaluator.evaluate({
            attemptNumber: 1,
            retryable: true,
            errorCode:
              'INVALID_RECIPIENT',
          }),
        ).toEqual({
          shouldRetry: false,
          reason:
            'ERROR_CODE_NOT_ALLOWED',
        });

        expect(
          evaluator.evaluate({
            attemptNumber: 1,
            retryable: true,
            errorCode:
              'RATE_LIMITED',
          }).shouldRetry,
        ).toBe(true);
      },
    );

    it(
      'blocks invalid policy configuration',
      () => {
        expect(
          validateRetryPolicy({
            maximumAttempts: 0,
            initialDelayMilliseconds:
              -1,
            backoffMultiplier: 0,
          }),
        ).toMatchObject({
          status: 'BLOCKED',
        });

        expect(
          () =>
            new CommunicationRetryEvaluator({
              maximumAttempts: 0,
              initialDelayMilliseconds:
                -1,
              backoffMultiplier: 0,
            }),
        ).toThrow(
          'COMMUNICATION_RETRY_POLICY_BLOCKED',
        );
      },
    );
  },
);
