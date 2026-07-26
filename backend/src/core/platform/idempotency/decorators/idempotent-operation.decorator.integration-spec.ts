import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  IDEMPOTENT_OPERATION_METADATA,
  IdempotentOperation,
  IdempotentOperationOptions,
} from './idempotent-operation.decorator';

describe(
  'IdempotentOperation',
  () => {
    it(
      'stores operation metadata on a handler',
      () => {
        class TestController {
          execute() {
            return true;
          }
        }

        const descriptor =
          Object.getOwnPropertyDescriptor(
            TestController.prototype,
            'execute',
          );

        if (!descriptor) {
          throw new Error(
            'Handler descriptor is missing',
          );
        }

        const options:
          IdempotentOperationOptions = {
            operation:
              'platform.test.execute',
            required:
              true,
            expiresInSeconds:
              300,
            resource:
              () =>
                'resource:test',
          };

        IdempotentOperation(
          options,
        )(
          TestController.prototype,
          'execute',
          descriptor,
        );

        expect(
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            descriptor.value,
          ),
        ).toBe(options);
      },
    );
  },
);
