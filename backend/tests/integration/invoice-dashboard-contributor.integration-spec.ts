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
  InvoiceDashboardContributorService,
} from '../../src/core/invoice/services/invoice-dashboard-contributor.service';
import {
  InvoiceService,
} from '../../src/core/invoice/services/invoice.service';

describe(
  'InvoiceDashboardContributorService',
  () => {
    it(
      'registers itself for Invoice',
      () => {
        const registry =
          new PluginDashboardRegistry();

        const invoiceService = {
          findAll:
            jest.fn<
              InvoiceService['findAll']
            >(),
        };

        const contributor =
          new InvoiceDashboardContributorService(
            registry,
            invoiceService as unknown as InvoiceService,
          );

        contributor.onModuleInit();

        expect(
          registry.findByPlugin(
            'invoice',
          ),
        ).toEqual([
          contributor,
        ]);
      },
    );

    it(
      'contributes total and overdue counts',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const invoiceService = {
          findAll:
            jest.fn<
              InvoiceService['findAll']
            >().mockResolvedValue([
              {
                status: 'OVERDUE',
              } as never,
              {
                status: 'ISSUED',
              } as never,
              {
                status: 'OVERDUE',
              } as never,
            ]),
        };

        const contributor =
          new InvoiceDashboardContributorService(
            registry,
            invoiceService as unknown as InvoiceService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          invoices: 3,
          overdueInvoices: 2,
        });
      },
    );
  },
);
