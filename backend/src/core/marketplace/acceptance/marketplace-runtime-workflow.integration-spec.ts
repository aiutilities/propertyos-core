import {
  BadRequestException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PlatformRuntimeService,
} from '../../platform/runtime/platform-runtime.service';
import {
  PluginDependencyResolverService,
} from '../../plugin/installer/dependency/plugin-dependency-resolver.service';
import {
  PluginInstallerService,
} from '../../plugin/installer/services/plugin-installer.service';
import {
  PluginPublicationGovernanceService,
} from '../../plugin/publication/plugin-publication-governance.service';
import {
  PluginPublicationInstallationService,
} from '../../plugin/publication/plugin-publication-installation.service';
import {
  PluginService,
} from '../../plugin/services/plugin.service';
import {
  MarketplaceCatalogService,
} from '../services/marketplace-catalog.service';
import {
  MarketplaceVersionService,
} from '../version/services/marketplace-version.service';
import {
  MarketplaceInstallService,
} from '../install/services/marketplace-install.service';
import {
  MarketplaceUpgradeService,
} from '../upgrade/services/marketplace-upgrade.service';
import {
  MarketplaceRollbackService,
} from '../rollback/services/marketplace-rollback.service';
import {
  MarketplaceUninstallService,
} from '../uninstall/services/marketplace-uninstall.service';
import {
  MarketplaceResolutionPlannerService,
} from '../resolution/services/marketplace-resolution-planner.service';

interface InstalledState {
  id: string;
  name: string;
  version: string;
  status: string;
}

interface ApprovedVersion {
  publicationId: string;
  version: string;
  minimumPlatformVersion: string | null;
  dependencies: string[];
}

const PLUGIN_SLUG =
  'workflow-plugin';

const PLUGIN_ID =
  'workflow-plugin-id';

const INSTALLED_PLUGIN_ID =
  '11111111-1111-4111-8111-111111111111';

const ACTOR_ID =
  'acceptance-user';

const STORAGE_OBJECT_V1 =
  '22222222-2222-4222-8222-222222222221';

const STORAGE_OBJECT_V2 =
  '22222222-2222-4222-8222-222222222222';

describe(
  'Marketplace runtime workflow acceptance',
  () => {

  const lifecycleMetrics =
    {
      observe: jest.fn(async (_operation: string, execute: () => Promise<unknown>) => execute()),
    } as any;

    it(
      'plans and executes install, upgrade, rollback and uninstall through existing runtimes',
      async () => {
        let installed:
          InstalledState | null =
          null;

        const approvedVersions:
          Record<string, ApprovedVersion> = {
            '1.0.0': {
              publicationId:
                '33333333-3333-4333-8333-333333333331',
              version:
                '1.0.0',
              minimumPlatformVersion:
                null,
              dependencies: [],
            },
            '2.0.0': {
              publicationId:
                '33333333-3333-4333-8333-333333333332',
              version:
                '2.0.0',
              minimumPlatformVersion:
                null,
              dependencies: [],
            },
          };

        const catalogue = {
          details:
            jest.fn(
              async (
                slug: string,
              ) => ({
                id:
                  'marketplace-entry',
                slug,
                pluginId:
                  installed?.id ??
                  null,
              }),
            ),
        };

        const versions = {
          details:
            jest.fn(
              async (
                slug: string,
                version: string,
              ) => {
                expect(slug).toBe(
                  PLUGIN_SLUG,
                );

                const approved =
                  approvedVersions[
                    version
                  ];

                if (!approved) {
                  throw new Error(
                    'APPROVED_VERSION_NOT_FOUND',
                  );
                }

                return approved;
              },
            ),
        };

        const governance = {
          get:
            jest.fn(
              async (
                publicationId: string,
              ) => {
                const approved =
                  Object.values(
                    approvedVersions,
                  ).find(
                    (item) =>
                      item.publicationId ===
                      publicationId,
                  );

                if (!approved) {
                  throw new Error(
                    'PUBLICATION_NOT_FOUND',
                  );
                }

                return {
                  id:
                    approved.publicationId,
                  pluginId:
                    PLUGIN_ID,
                  pluginName:
                    'Workflow Plugin',
                  version:
                    approved.version,
                  publisherId:
                    'propertyos',
                  keyId:
                    'release-key',
                  artifactStorageObjectId:
                    approved.version ===
                    '1.0.0'
                      ? STORAGE_OBJECT_V1
                      : STORAGE_OBJECT_V2,
                  artifactSha256:
                    'a'.repeat(64),
                  integritySha256:
                    'b'.repeat(64),
                  status:
                    'APPROVED',
                  submittedBy:
                    ACTOR_ID,
                  submittedAt:
                    new Date(),
                  metadata: {},
                  updatedAt:
                    new Date(),
                };
              },
            ),
        };

        const installer = {
          install:
            jest.fn(
              async (
                input: {
                  provenance: {
                    pluginId: string;
                    version: string;
                  };
                },
              ) => {
                installed = {
                  id:
                    INSTALLED_PLUGIN_ID,
                  name:
                    PLUGIN_ID,
                  version:
                    input.provenance
                      .version,
                  status:
                    'ACTIVE',
                };

                return {
                  success: true,
                  stage:
                    'COMPLETE',
                  messages: [],
                };
              },
            ),
        };

        const pluginRuntime = {
          installedPlugins:
            jest.fn(
              async () =>
                installed
                  ? [
                      {
                        ...installed,
                      },
                    ]
                  : [],
            ),

          upgrade:
            jest.fn(
              async (
                id: string,
                dto: {
                  version: string;
                  notes?: string;
                },
              ) => {
                expect(
                  installed?.id,
                ).toBe(id);

                const previousVersion =
                  installed?.version;

                installed = {
                  id,
                  name:
                    PLUGIN_ID,
                  version:
                    dto.version,
                  status:
                    'ACTIVE',
                };

                return {
                  success: true,
                  status:
                    'UPGRADED',
                  fromVersion:
                    previousVersion,
                  toVersion:
                    dto.version,
                };
              },
            ),

          rollback:
            jest.fn(
              async (
                id: string,
                dto: {
                  targetVersion: string;
                  notes?: string;
                },
              ) => {
                expect(
                  installed?.id,
                ).toBe(id);

                const previousVersion =
                  installed?.version;

                installed = {
                  id,
                  name:
                    PLUGIN_ID,
                  version:
                    dto.targetVersion,
                  status:
                    'ACTIVE',
                };

                return {
                  success: true,
                  status:
                    'ROLLED_BACK',
                  fromVersion:
                    previousVersion,
                  toVersion:
                    dto.targetVersion,
                };
              },
            ),

          uninstall:
            jest.fn(
              async (
                id: string,
              ) => {
                expect(
                  installed?.id,
                ).toBe(id);

                installed = null;

                return {
                  success: true,
                  status:
                    'UNINSTALLED',
                };
              },
            ),
        };

        const publicationInstaller =
          new PluginPublicationInstallationService(
            governance as unknown as
              PluginPublicationGovernanceService,
            installer as unknown as
              PluginInstallerService,
          );

        const installAdapter =
          new MarketplaceInstallService(
            versions as unknown as
              MarketplaceVersionService,
            publicationInstaller,
                      lifecycleMetrics,
          );

        const upgradeAdapter =
          new MarketplaceUpgradeService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            pluginRuntime as unknown as
              PluginService,
                      lifecycleMetrics,
          );

        const rollbackAdapter =
          new MarketplaceRollbackService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            pluginRuntime as unknown as
              PluginService,
                      lifecycleMetrics,
          );

        const uninstallAdapter =
          new MarketplaceUninstallService(
            catalogue as unknown as
              MarketplaceCatalogService,
            pluginRuntime as unknown as
              PluginService,
                      lifecycleMetrics,
          );

        const planner =
          new MarketplaceResolutionPlannerService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            pluginRuntime as unknown as
              PluginService,
            new PluginDependencyResolverService(),
            new PlatformRuntimeService(),
          );

        const installPlan =
          await planner.plan(
            PLUGIN_SLUG,
            '1.0.0',
          );

        expect(
          installPlan,
        ).toMatchObject({
          action:
            'INSTALL',
          executable:
            true,
          installedPluginId:
            null,
          installedVersion:
            null,
          publicationId:
            approvedVersions[
              '1.0.0'
            ].publicationId,
        });

        await installAdapter.install(
          PLUGIN_SLUG,
          '1.0.0',
          ACTOR_ID,
          true,
          false,
          {
            publicationId:
              'client-controlled',
            requestedBy:
              'client-controlled',
            installationSource:
              'client-controlled',
          },
        );

        expect(
          installed,
        ).toMatchObject({
          id:
            INSTALLED_PLUGIN_ID,
          version:
            '1.0.0',
          status:
            'ACTIVE',
        });

        expect(
          installer.install,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            storageObjectId:
              STORAGE_OBJECT_V1,
            provenance:
              expect.objectContaining({
                publicationId:
                  approvedVersions[
                    '1.0.0'
                  ].publicationId,
                pluginId:
                  PLUGIN_ID,
                version:
                  '1.0.0',
                publisherId:
                  'propertyos',
                keyId:
                  'release-key',
                artifactSha256:
                  'a'.repeat(64),
                integritySha256:
                  'b'.repeat(64),
              }),
            metadata:
              expect.objectContaining({
                publicationId:
                  approvedVersions[
                    '1.0.0'
                  ].publicationId,
                requestedBy:
                  ACTOR_ID,
                installationSource:
                  'approved-publication',
              }),
          }),
        );

        const upgradePlan =
          await planner.plan(
            PLUGIN_SLUG,
            '2.0.0',
          );

        expect(
          upgradePlan,
        ).toMatchObject({
          action:
            'UPGRADE',
          executable:
            true,
          installedPluginId:
            INSTALLED_PLUGIN_ID,
          installedVersion:
            '1.0.0',
        });

        await upgradeAdapter.upgrade(
          PLUGIN_SLUG,
          '2.0.0',
          'Acceptance upgrade',
        );

        expect(
          installed,
        ).toMatchObject({
          version:
            '2.0.0',
        });

        expect(
          pluginRuntime.upgrade,
        ).toHaveBeenCalledWith(
          INSTALLED_PLUGIN_ID,
          {
            version:
              '2.0.0',
            notes:
              'Acceptance upgrade',
          },
        );

        const rollbackPlan =
          await planner.plan(
            PLUGIN_SLUG,
            '1.0.0',
          );

        expect(
          rollbackPlan,
        ).toMatchObject({
          action:
            'ROLLBACK',
          executable:
            true,
          installedPluginId:
            INSTALLED_PLUGIN_ID,
          installedVersion:
            '2.0.0',
        });

        await rollbackAdapter.rollback(
          PLUGIN_SLUG,
          '1.0.0',
          'Acceptance rollback',
        );

        expect(
          installed,
        ).toMatchObject({
          version:
            '1.0.0',
        });

        expect(
          pluginRuntime.rollback,
        ).toHaveBeenCalledWith(
          INSTALLED_PLUGIN_ID,
          {
            targetVersion:
              '1.0.0',
            notes:
              'Acceptance rollback',
          },
        );

        await uninstallAdapter.uninstall(
          PLUGIN_SLUG,
        );

        expect(
          installed,
        ).toBeNull();

        expect(
          pluginRuntime.uninstall,
        ).toHaveBeenCalledWith(
          INSTALLED_PLUGIN_ID,
        );

        const finalPlan =
          await planner.plan(
            PLUGIN_SLUG,
            '1.0.0',
          );

        expect(
          finalPlan,
        ).toMatchObject({
          action:
            'INSTALL',
          executable:
            true,
          installedPluginId:
            null,
          installedVersion:
            null,
        });
      },
    );

    it(
      'blocks execution planning when a required dependency is missing',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async () => ({
                pluginId: null,
              }),
            ),
        };

        const versions = {
          details:
            jest.fn(
              async () => ({
                publicationId:
                  '33333333-3333-4333-8333-333333333333',
                version:
                  '1.0.0',
                minimumPlatformVersion:
                  null,
                dependencies: [
                  'required-plugin@^2.0.0',
                ],
              }),
            ),
        };

        const pluginRuntime = {
          installedPlugins:
            jest.fn(
              async () => [],
            ),
          upgrade:
            jest.fn(),
          rollback:
            jest.fn(),
          uninstall:
            jest.fn(),
        };

        const planner =
          new MarketplaceResolutionPlannerService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            pluginRuntime as unknown as
              PluginService,
            new PluginDependencyResolverService(),
            new PlatformRuntimeService(),
          );

        const result =
          await planner.plan(
            PLUGIN_SLUG,
            '1.0.0',
          );

        expect(result).toMatchObject({
          action:
            'INSTALL',
          executable:
            false,
          missingDependencies: [
            'required-plugin',
          ],
          executionOrder: [
            'required-plugin',
            PLUGIN_SLUG,
          ],
        });

        expect(
          result.errors.join(' '),
        ).toContain(
          'Missing plugin dependency',
        );

        expect(
          pluginRuntime.upgrade,
        ).not.toHaveBeenCalled();

        expect(
          pluginRuntime.rollback,
        ).not.toHaveBeenCalled();

        expect(
          pluginRuntime.uninstall,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks execution planning when the platform version is incompatible',
      async () => {
        const catalogue = {
          details:
            jest.fn(
              async () => ({
                pluginId: null,
              }),
            ),
        };

        const versions = {
          details:
            jest.fn(
              async () => ({
                publicationId:
                  '33333333-3333-4333-8333-333333333334',
                version:
                  '1.0.0',
                minimumPlatformVersion:
                  '99.0.0',
                dependencies: [],
              }),
            ),
        };

        const pluginRuntime = {
          installedPlugins:
            jest.fn(
              async () => [],
            ),
        };

        const runtime = {
          platformVersion:
            () => '1.0.0',
        };

        const planner =
          new MarketplaceResolutionPlannerService(
            catalogue as unknown as
              MarketplaceCatalogService,
            versions as unknown as
              MarketplaceVersionService,
            pluginRuntime as unknown as
              PluginService,
            new PluginDependencyResolverService(),
            runtime as
              PlatformRuntimeService,
          );

        const result =
          await planner.plan(
            PLUGIN_SLUG,
            '1.0.0',
          );

        expect(result).toMatchObject({
          executable:
            false,
          platformCompatible:
            false,
          currentPlatformVersion:
            '1.0.0',
          minimumPlatformVersion:
            '99.0.0',
        });
      },
    );

    it.each([
      'SUBMITTED',
      'REJECTED',
      'QUARANTINED',
      'REVOKED',
    ])(
      'rejects lifecycle installation from a %s publication',
      async (
        publicationStatus,
      ) => {
        const versions = {
          details:
            jest.fn(
              async () => ({
                publicationId:
                  '33333333-3333-4333-8333-333333333335',
                version:
                  '1.0.0',
              }),
            ),
        };

        const governance = {
          get:
            jest.fn(
              async () => ({
                id:
                  '33333333-3333-4333-8333-333333333335',
                pluginId:
                  PLUGIN_ID,
                pluginName:
                  'Workflow Plugin',
                version:
                  '1.0.0',
                publisherId:
                  'propertyos',
                keyId:
                  'release-key',
                artifactStorageObjectId:
                  STORAGE_OBJECT_V1,
                artifactSha256:
                  'a'.repeat(64),
                integritySha256:
                  'b'.repeat(64),
                status:
                  publicationStatus,
                submittedBy:
                  ACTOR_ID,
                submittedAt:
                  new Date(),
                metadata: {},
                updatedAt:
                  new Date(),
              }),
            ),
        };

        const installer = {
          install:
            jest.fn(),
        };

        const publicationInstaller =
          new PluginPublicationInstallationService(
            governance as unknown as
              PluginPublicationGovernanceService,
            installer as unknown as
              PluginInstallerService,
          );

        const marketplaceInstall =
          new MarketplaceInstallService(
            versions as unknown as
              MarketplaceVersionService,
            publicationInstaller,
                      lifecycleMetrics,
          );

        await expect(
          marketplaceInstall.install(
            PLUGIN_SLUG,
            '1.0.0',
            ACTOR_ID,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          installer.install,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
