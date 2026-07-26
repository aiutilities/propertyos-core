import 'reflect-metadata';

import {
  INTERCEPTORS_METADATA,
} from '@nestjs/common/constants';
import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Request,
} from 'express';

import {
  IDEMPOTENT_OPERATION_METADATA,
  IdempotentOperationOptions,
} from '../platform/idempotency/decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyInterceptor,
} from '../platform/idempotency/http/platform-idempotency.interceptor';
import {
  InventoryMaterialIssueController,
} from './controllers/inventory-material-issue.controller';
import {
  InventoryMaterialReturnController,
} from './controllers/inventory-material-return.controller';
import {
  InventoryStockAdjustmentController,
} from './controllers/inventory-stock-adjustment.controller';
import {
  InventoryStockTransferController,
} from './controllers/inventory-stock-transfer.controller';

interface InventoryWiringCase {
  name: string;
  handler: Function;
  operation: string;
  id: string;
  expectedResource: string;
}

const cases:
  InventoryWiringCase[] = [
    {
      name:
        'material issue post',
      handler:
        InventoryMaterialIssueController
          .prototype.postMaterialIssue,
      operation:
        'inventory.material-issue.post',
      id:
        'issue-1',
      expectedResource:
        'inventory-material-issue:issue-1',
    },
    {
      name:
        'material return post',
      handler:
        InventoryMaterialReturnController
          .prototype.postMaterialReturn,
      operation:
        'inventory.material-return.post',
      id:
        'return-1',
      expectedResource:
        'inventory-material-return:return-1',
    },
    {
      name:
        'stock adjustment post',
      handler:
        InventoryStockAdjustmentController
          .prototype.postAdjustment,
      operation:
        'inventory.stock-adjustment.post',
      id:
        'adjustment-1',
      expectedResource:
        'inventory-stock-adjustment:adjustment-1',
    },
    {
      name:
        'stock transfer dispatch',
      handler:
        InventoryStockTransferController
          .prototype.dispatch,
      operation:
        'inventory.stock-transfer.dispatch',
      id:
        'transfer-1',
      expectedResource:
        'inventory-stock-transfer:transfer-1',
    },
    {
      name:
        'stock transfer receive',
      handler:
        InventoryStockTransferController
          .prototype.receive,
      operation:
        'inventory.stock-transfer.receive',
      id:
        'transfer-1',
      expectedResource:
        'inventory-stock-transfer:transfer-1',
    },
  ];

describe(
  'Inventory posting idempotency wiring',
  () => {
    it.each(
      cases,
    )(
      'requires idempotency for $name',
      ({
        handler,
        operation,
        id,
        expectedResource,
      }) => {
        const interceptors =
          Reflect.getMetadata(
            INTERCEPTORS_METADATA,
            handler,
          ) as
            unknown[] |
            undefined;

        expect(
          interceptors,
        ).toContain(
          PlatformIdempotencyInterceptor,
        );

        const options =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            handler,
          ) as
            IdempotentOperationOptions |
            undefined;

        expect(
          options,
        ).toBeDefined();

        expect(
          options,
        ).toMatchObject({
          operation,
          required:
            true,
          expiresInSeconds:
            24 * 60 * 60,
        });

        const request = {
          params: {
            id,
          },
        } as unknown as
          Request;

        expect(
          options?.resource(
            request,
          ),
        ).toBe(
          expectedResource,
        );
      },
    );

    it(
      'uses distinct operation scopes for all five inventory actions',
      () => {
        const operations =
          cases.map(
            ({
              handler,
            }) => {
              const options =
                Reflect.getMetadata(
                  IDEMPOTENT_OPERATION_METADATA,
                  handler,
                ) as
                  IdempotentOperationOptions;

              return options.operation;
            },
          );

        expect(
          new Set(
            operations,
          ).size,
        ).toBe(
          cases.length,
        );
      },
    );

    it(
      'keeps dispatch and receive on the same transfer resource',
      () => {
        const dispatch =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            InventoryStockTransferController
              .prototype.dispatch,
          ) as
            IdempotentOperationOptions;

        const receive =
          Reflect.getMetadata(
            IDEMPOTENT_OPERATION_METADATA,
            InventoryStockTransferController
              .prototype.receive,
          ) as
            IdempotentOperationOptions;

        const request = {
          params: {
            id:
              'transfer-shared',
          },
        } as unknown as
          Request;

        expect(
          dispatch.resource(
            request,
          ),
        ).toBe(
          receive.resource(
            request,
          ),
        );

        expect(
          dispatch.operation,
        ).not.toBe(
          receive.operation,
        );
      },
    );
  },
);
