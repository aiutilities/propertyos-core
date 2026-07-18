import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PluginDashboardRegistry,
} from './plugin-dashboard.registry';

describe(
  'PluginDashboardRegistry',
  () => {
    it(
      'collects registered metrics',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        registry.register(
          'receipt',
          [
            {
              contribute:
                async () => ({
                  receipts: 3,
                }),
            },
          ],
        );

        await expect(
          registry.collect('receipt'),
        ).resolves.toEqual({
          receipts: 3,
        });
      },
    );

    it(
      'aggregates multiple contributors',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        registry.register(
          'receipt',
          [
            {
              contribute:
                async () => ({
                  receipts: 2,
                }),
            },
            {
              contribute:
                async () => ({
                  receipts: 4,
                }),
            },
          ],
        );

        await expect(
          registry.collect('receipt'),
        ).resolves.toEqual({
          receipts: 6,
        });
      },
    );

    it(
      'returns empty metrics for an absent plugin',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        await expect(
          registry.collect('receipt'),
        ).resolves.toEqual({});
      },
    );

    it(
      'rejects non-finite metrics',
      async () => {
        const registry =
          new PluginDashboardRegistry();

        registry.register(
          'receipt',
          [
            {
              contribute:
                async () => ({
                  receipts:
                    Number.NaN,
                }),
            },
          ],
        );

        await expect(
          registry.collect('receipt'),
        ).rejects.toThrow(
          'Dashboard metric must be finite',
        );
      },
    );
  },
);
