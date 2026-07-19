import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  PluginEntity,
} from '../entities/plugin.entity';
import {
  PluginLifecycleService,
} from './plugin-lifecycle.service';

describe(
  'PluginLifecycleService version policy',
  () => {
    const eventBus = {
      publish:
        jest.fn(
          async () => undefined,
        ),
    };

    const service =
      new PluginLifecycleService(
        eventBus as never,
      );

    const plugin = (
      version: string,
    ) => ({
      id: 'plugin-1',
      name: 'example-plugin',
      displayName: 'Example Plugin',
      version,
      status: 'INACTIVE',
      manifest: {
        name: 'example-plugin',
        displayName: 'Example Plugin',
        version,
      },
    }) as PluginEntity;

    it(
      'allows a strictly increasing upgrade',
      async () => {
        await expect(
          service.upgrade(
            plugin('1.0.0'),
            {
              version: '1.1.0',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            version: '1.1.0',
          }),
        );
      },
    );

    it.each([
      ['same version', '1.0.0'],
      ['lower version', '0.9.0'],
    ])(
      'rejects %s as an upgrade',
      async (
        _description,
        targetVersion,
      ) => {
        await expect(
          service.upgrade(
            plugin('1.0.0'),
            {
              version:
                targetVersion,
            },
          ),
        ).rejects.toThrow(
          'PLUGIN_UPGRADE_VERSION_MUST_INCREASE',
        );
      },
    );

    it(
      'allows a strictly decreasing rollback',
      async () => {
        await expect(
          service.rollback(
            plugin('1.1.0'),
            {
              targetVersion:
                '1.0.0',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            version: '1.0.0',
          }),
        );
      },
    );

    it.each([
      ['same version', '1.1.0'],
      ['higher version', '1.2.0'],
    ])(
      'rejects %s as a rollback',
      async (
        _description,
        targetVersion,
      ) => {
        await expect(
          service.rollback(
            plugin('1.1.0'),
            {
              targetVersion:
                targetVersion,
            },
          ),
        ).rejects.toThrow(
          'PLUGIN_ROLLBACK_VERSION_MUST_DECREASE',
        );
      },
    );

    it.each([
      ['upgrade', 'invalid', '1.0.0'],
      ['upgrade', '1.0.0', 'invalid'],
      ['rollback', 'invalid', '1.0.0'],
      ['rollback', '1.0.0', 'invalid'],
    ])(
      'rejects invalid semantic versions during %s',
      async (
        operation,
        currentVersion,
        targetVersion,
      ) => {
        const promise =
          operation === 'upgrade'
            ? service.upgrade(
                plugin(
                  currentVersion,
                ),
                {
                  version:
                    targetVersion,
                },
              )
            : service.rollback(
                plugin(
                  currentVersion,
                ),
                {
                  targetVersion:
                    targetVersion,
                },
              );

        await expect(
          promise,
        ).rejects.toThrow(
          /_VERSION_INVALID/,
        );
      },
    );
  },
);
