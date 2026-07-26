import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PluginPublicationInstallationService,
} from '../../../plugin/publication/plugin-publication-installation.service';
import {
  MarketplaceVersionService,
} from '../../version/services/marketplace-version.service';
import {
  MarketplaceInstallService,
} from './marketplace-install.service';

describe(
  'MarketplaceInstallService',
  () => {
    it(
      'resolves an approved version and delegates installation',
      async () => {
        const versions = {
          details:
            jest.fn(
              async (
                _slug: string,
                _version: string,
              ) => ({
              publicationId:
                '11111111-1111-4111-8111-111111111111',
              pluginId:
                'example-plugin',
              version:
                '1.2.0',
              }),
            ),
        };

        const installer = {
          install:
            jest.fn(
              async (
                _input: {
                  publicationId: string;
                  actorId: string;
                  autoEnable?: boolean;
                  overwrite?: boolean;
                  metadata?: Record<string, unknown>;
                },
              ) => ({
              success: true,
              stage: 'COMPLETE',
              messages: [
                'Installed',
              ],
              }),
            ),
        };

        const service =
          new MarketplaceInstallService(
            versions as unknown as
              MarketplaceVersionService,
            installer as unknown as
              PluginPublicationInstallationService,
          );

        const result =
          await service.install(
            'example-plugin',
            '1.2.0',
            'person-1',
            true,
            false,
            {
              requestSource:
                'marketplace-ui',
            },
          );

        expect(
          versions.details,
        ).toHaveBeenCalledWith(
          'example-plugin',
          '1.2.0',
        );

        expect(
          installer.install,
        ).toHaveBeenCalledWith({
          publicationId:
            '11111111-1111-4111-8111-111111111111',
          actorId:
            'person-1',
          autoEnable:
            true,
          overwrite:
            false,
          metadata: {
            requestSource:
              'marketplace-ui',
          },
        });

        expect(result).toMatchObject({
          success: true,
          stage: 'COMPLETE',
        });
      },
    );

    it(
      'does not accept publication provenance from metadata',
      async () => {
        const versions = {
          details:
            jest.fn(
              async (
                _slug: string,
                _version: string,
              ) => ({
                publicationId:
                  '22222222-2222-4222-8222-222222222222',
              }),
            ),
        };

        const installer = {
          install:
            jest.fn(
              async (
                input: {
                  publicationId: string;
                  actorId: string;
                  autoEnable?: boolean;
                  overwrite?: boolean;
                  metadata?: Record<string, unknown>;
                },
              ) => input,
            ),
        };

        const service =
          new MarketplaceInstallService(
            versions as unknown as
              MarketplaceVersionService,
            installer as unknown as
              PluginPublicationInstallationService,
          );

        await service.install(
          'example-plugin',
          '2.0.0',
          'person-2',
          false,
          false,
          {
            publicationId:
              'attacker-controlled',
            artifactStorageObjectId:
              'attacker-controlled',
          },
        );

        expect(
          installer.install,
        ).toHaveBeenCalledWith({
          publicationId:
            '22222222-2222-4222-8222-222222222222',
          actorId:
            'person-2',
          autoEnable:
            false,
          overwrite:
            false,
          metadata: {
            publicationId:
              'attacker-controlled',
            artifactStorageObjectId:
              'attacker-controlled',
          },
        });
      },
    );
  },
);
