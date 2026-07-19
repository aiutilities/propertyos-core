import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  PluginInstallerService,
} from '../installer/services/plugin-installer.service';
import {
  PluginInstallationResult,
} from '../installer/types/plugin-installer.types';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';

export interface InstallApprovedPluginPublication {
  publicationId: string;
  actorId: string;
  autoEnable?: boolean;
  overwrite?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PluginPublicationInstallationService {
  constructor(
    private readonly governance:
      PluginPublicationGovernanceService,
    private readonly installer:
      PluginInstallerService,
  ) {}

  async install(
    input:
      InstallApprovedPluginPublication,
  ): Promise<PluginInstallationResult> {
    this.assertInput(input);

    const publication =
      await this.governance.get(
        input.publicationId,
      );

    if (
      publication.status !==
        'APPROVED'
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_NOT_INSTALLABLE',
      );
    }

    const result =
      await this.installer.install({
        storageObjectId:
          publication
            .artifactStorageObjectId,
        autoEnable:
          input.autoEnable,
        overwrite:
          input.overwrite,
        metadata: {
          ...input.metadata,
          installationSource:
            'approved-publication',
          publicationId:
            publication.id,
          requestedBy:
            input.actorId,
        },
        provenance: {
          publicationId:
            publication.id,
          pluginId:
            publication.pluginId,
          version:
            publication.version,
          publisherId:
            publication.publisherId,
          keyId:
            publication.keyId,
          artifactStorageObjectId:
            publication
              .artifactStorageObjectId,
          artifactSha256:
            publication.artifactSha256,
          integritySha256:
            publication.integritySha256,
        },
      });

    return result;
  }

  private assertInput(
    input:
      InstallApprovedPluginPublication,
  ): void {
    if (
      !/^[a-f0-9-]{36}$/.test(
        input.publicationId,
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_ID_INVALID',
      );
    }

    if (
      !input.actorId ||
      input.actorId.length > 150
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_INSTALL_ACTOR_INVALID',
      );
    }

    if (
      input.metadata !== undefined &&
      (
        !input.metadata ||
        Array.isArray(
          input.metadata,
        ) ||
        typeof input.metadata !==
          'object'
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_INSTALL_METADATA_INVALID',
      );
    }
  }
}
