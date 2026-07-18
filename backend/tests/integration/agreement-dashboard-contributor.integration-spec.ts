import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PluginDashboardRegistry,
} from '../../src/core/plugin/registries/plugin-dashboard.registry';
import {
  AgreementDashboardContributorService,
} from '../../src/core/agreement/services/agreement-dashboard-contributor.service';
import {
  AgreementService,
} from '../../src/core/agreement/services/agreement.service';

describe(
  'AgreementDashboardContributorService',
  () => {
    it(
      'registers itself for Agreement',
      () => {
        const registry =
          new PluginDashboardRegistry();

        const agreementService = {
          listAgreements:
            async () => [],
        };

        const contributor =
          new AgreementDashboardContributorService(
            registry,
            agreementService as unknown as AgreementService,
          );

        contributor.onModuleInit();

        expect(
          registry.findByPlugin(
            'agreement',
          ),
        ).toEqual([
          contributor,
        ]);
      },
    );

    it(
      'contributes the active lease count',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        const agreementService = {
          listAgreements:
            async () => [
              {
                status: 'ACTIVE',
              },
              {
                status: 'EXPIRED',
              },
              {
                status: 'ACTIVE',
              },
              {
                status: 'TERMINATED',
              },
            ],
        };

        const contributor =
          new AgreementDashboardContributorService(
            registry,
            agreementService as unknown as AgreementService,
          );

        await expect(
          contributor.contribute(),
        ).resolves.toEqual({
          activeLeases: 2,
        });
      },
    );
  },
);
