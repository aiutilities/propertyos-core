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
  MarketplaceInstallController,
} from './install/controllers/marketplace-install.controller';
import {
  MarketplaceRollbackController,
} from './rollback/controllers/marketplace-rollback.controller';
import {
  MarketplaceUninstallController,
} from './uninstall/controllers/marketplace-uninstall.controller';
import {
  MarketplaceUpgradeController,
} from './upgrade/controllers/marketplace-upgrade.controller';

interface WiringCase {
  name: string;
  handler: Function;
  operation: string;
  params:
    Record<string, string>;
  expectedResource: string;
}

const wiringCases:
  WiringCase[] = [
    {
      name:
        'install',
      handler:
        MarketplaceInstallController
          .prototype.install,
      operation:
        'marketplace.install',
      params: {
        slug:
          'example-plugin',
        version:
          '1.0.0',
      },
      expectedResource:
        'marketplace-plugin:example-plugin@1.0.0',
    },
    {
      name:
        'upgrade',
      handler:
        MarketplaceUpgradeController
          .prototype.upgrade,
      operation:
        'marketplace.upgrade',
      params: {
        slug:
          'example-plugin',
        version:
          '2.0.0',
      },
      expectedResource:
        'marketplace-plugin:example-plugin@2.0.0',
    },
    {
      name:
        'rollback',
      handler:
        MarketplaceRollbackController
          .prototype.rollback,
      operation:
        'marketplace.rollback',
      params: {
        slug:
          'example-plugin',
        version:
          '1.0.0',
      },
      expectedResource:
        'marketplace-plugin:example-plugin@1.0.0',
    },
    {
      name:
        'uninstall',
      handler:
        MarketplaceUninstallController
          .prototype.uninstall,
      operation:
        'marketplace.uninstall',
      params: {
        slug:
          'example-plugin',
      },
      expectedResource:
        'marketplace-plugin:example-plugin',
    },
  ];

describe(
  'Marketplace idempotency wiring',
  () => {
    it.each(
      wiringCases,
    )(
      'requires idempotency for $name',
      ({
        handler,
        operation,
        params,
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
          params,
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
      'uses independent operation scopes for each lifecycle action',
      () => {
        const operations =
          wiringCases.map(
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
          wiringCases.length,
        );
      },
    );
  },
);
