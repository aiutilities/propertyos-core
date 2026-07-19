import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
} from '@nestjs/common';
import {
  PluginInstallerService,
} from '../installer/services/plugin-installer.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';

const PUBLICATION_ID =
  '11111111-1111-4111-8111-111111111111';

describe(
  'PluginPublicationInstallationService',
  () => {
    it(
      'installs only from immutable approved publication evidence',
      async () => {
        const governance = {
          get:
            jest.fn(
              async () =>
                publication(
                  'APPROVED',
                ),
            ),
        };

        const installer = {
          install:
            jest.fn(
              async (
                _input: unknown,
              ) => ({
                success:
                  true,
                stage:
                  'COMPLETE',
                messages: [],
              }),
            ),
        };

        const service =
          new PluginPublicationInstallationService(
            governance as unknown as
              PluginPublicationGovernanceService,
            installer as unknown as
              PluginInstallerService,
          );

        await service.install({
          publicationId:
            PUBLICATION_ID,
          actorId:
            'person-1',
          autoEnable:
            true,
          metadata: {
            publicationId:
              'attacker-controlled',
            requestedBy:
              'attacker-controlled',
          },
        });

        expect(
          installer.install,
        ).toHaveBeenCalledWith({
          storageObjectId:
            '22222222-2222-4222-8222-222222222222',
          autoEnable:
            true,
          overwrite:
            undefined,
          metadata: {
            publicationId:
              PUBLICATION_ID,
            requestedBy:
              'person-1',
            installationSource:
              'approved-publication',
          },
          provenance: {
            publicationId:
              PUBLICATION_ID,
            pluginId:
              'visitor',
            version:
              '1.0.0',
            publisherId:
              'propertyos',
            keyId:
              'release-2027',
            artifactStorageObjectId:
              '22222222-2222-4222-8222-222222222222',
            artifactSha256:
              'a'.repeat(64),
            integritySha256:
              'b'.repeat(64),
          },
        });
      },
    );

    it.each([
      'SUBMITTED',
      'REJECTED',
      'QUARANTINED',
      'REVOKED',
    ])(
      'rejects a non-approved publication with status %s',
      async (status) => {
        const installer = {
          install:
            jest.fn(),
        };

        const service =
          new PluginPublicationInstallationService(
            {
              get:
                jest.fn(
                  async () =>
                    publication(
                      status,
                    ),
                ),
            } as unknown as
              PluginPublicationGovernanceService,
            installer as unknown as
              PluginInstallerService,
          );

        await expect(
          service.install({
            publicationId:
              PUBLICATION_ID,
            actorId:
              'person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          installer.install,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects invalid identity before governance access',
      async () => {
        const governance = {
          get:
            jest.fn(),
        };

        const service =
          new PluginPublicationInstallationService(
            governance as unknown as
              PluginPublicationGovernanceService,
            {} as
              PluginInstallerService,
          );

        await expect(
          service.install({
            publicationId:
              '../publication',
            actorId:
              'person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          governance.get,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

function publication(
  status: string,
) {
  return {
    id:
      PUBLICATION_ID,
    pluginId:
      'visitor',
    pluginName:
      'Visitor',
    version:
      '1.0.0',
    publisherId:
      'propertyos',
    keyId:
      'release-2027',
    artifactStorageObjectId:
      '22222222-2222-4222-8222-222222222222',
    artifactSha256:
      'a'.repeat(64),
    integritySha256:
      'b'.repeat(64),
    status,
    submittedBy:
      'person-1',
    submittedAt:
      new Date(),
    metadata: {},
    updatedAt:
      new Date(),
  };
}
