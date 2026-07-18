import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PluginDashboardRegistry,
} from '../../src/core/plugin/registries/plugin-dashboard.registry';
import {
  ReceiptDashboardContributorService,
} from '../../src/core/receipt/services/receipt-dashboard-contributor.service';
import { ReceiptService } from '../../src/core/receipt/services/receipt.service';

describe(
  'ReceiptDashboardContributorService',
  () => {
    it(
      'registers itself for Receipt',
      () => {
        const registry =
          new PluginDashboardRegistry();

        const receiptService = {
          findAll:
            jest.fn<
              ReceiptService['findAll']
            >(),
        };

        const contributor =
          new ReceiptDashboardContributorService(
            registry,
            receiptService as unknown as ReceiptService,
          );

        contributor.onModuleInit();

        expect(
          registry.findByPlugin(
            'receipt',
          ),
        ).toEqual([
          contributor,
        ]);
      },
    );

    it(
      'contributes the Receipt count',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const receiptService = {
          findAll:
            jest.fn<
              ReceiptService['findAll']
            >().mockResolvedValue([
              {} as never,
              {} as never,
              {} as never,
            ]),
        };

        const contributor =
          new ReceiptDashboardContributorService(
            registry,
            receiptService as unknown as ReceiptService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          receipts: 3,
        });
      },
    );
  },
);
