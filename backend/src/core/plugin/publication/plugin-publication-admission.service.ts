import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  createHash,
  randomUUID,
} from 'crypto';
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'fs/promises';
import {
  join,
} from 'path';
import {
  StorageService,
} from '../../storage/services/storage.service';
import {
  PluginDiscoveryService,
} from '../installer/discovery/plugin-discovery.service';
import {
  PluginZipExtractorService,
} from '../installer/extractor/plugin-zip-extractor.service';
import {
  PluginInstallationManifestService,
} from '../installer/manifest/plugin-installation-manifest.service';
import {
  PluginSignatureVerifierService,
} from '../installer/signature/plugin-signature-verifier.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  PluginPublication,
} from './plugin-publication-governance.types';

interface AdmitPluginPublication {
  storageObjectId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

interface IntegrityIdentity {
  publisherId: string;
  keyId: string;
}

const MAXIMUM_ARCHIVE_BYTES =
  100 * 1024 * 1024;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

@Injectable()
export class PluginPublicationAdmissionService {
  constructor(
    private readonly storage:
      StorageService,
    private readonly extractor:
      PluginZipExtractorService,
    private readonly discovery:
      PluginDiscoveryService,
    private readonly manifestService:
      PluginInstallationManifestService,
    private readonly signatureVerifier:
      PluginSignatureVerifierService,
    private readonly governance:
      PluginPublicationGovernanceService,
  ) {}

  async admit(
    input: AdmitPluginPublication,
  ): Promise<PluginPublication> {
    const storageObject =
      await this.storage.getObject(
        input.storageObjectId,
      );

    this.assertPublicationUpload(
      storageObject,
    );

    const content =
      await this.storage.getContent(
        input.storageObjectId,
      );

    if (
      content.length !==
      storageObject.sizeBytes
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_ARTIFACT_SIZE_MISMATCH',
      );
    }

    const artifactSha256 =
      this.sha256(content);

    if (
      !storageObject.checksum ||
      storageObject.checksum
        .toLowerCase() !==
        artifactSha256
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_ARTIFACT_CHECKSUM_MISMATCH',
      );
    }

    const intakeDirectory =
      join(
        process.cwd(),
        'plugins',
        '.publication-intake',
      );
    const archivePath =
      join(
        intakeDirectory,
        `${randomUUID()}.zip`,
      );
    let extractedPath:
      string | undefined;

    await mkdir(
      intakeDirectory,
      {
        recursive: true,
      },
    );
    await writeFile(
      archivePath,
      content,
      {
        flag: 'wx',
        mode: 0o600,
      },
    );

    try {
      extractedPath =
        this.extractor.extract(
          archivePath,
        );

      const pluginRoot =
        this.discovery.discover(
          extractedPath,
        );
      const manifest =
        this.manifestService.discover(
          pluginRoot,
        );
      const verificationErrors =
        await this.signatureVerifier.verify(
          pluginRoot,
        );

      if (
        verificationErrors.length >
        0
      ) {
        throw new BadRequestException(
          [
            'PLUGIN_PUBLICATION_SIGNATURE_INVALID',
            ...verificationErrors,
          ].join(': '),
        );
      }

      const integrityPath =
        join(
          pluginRoot,
          'plugin.integrity.json',
        );
      const integrityBytes =
        await readFile(
          integrityPath,
        );
      const integrityIdentity =
        this.parseIntegrityIdentity(
          integrityBytes,
        );

      if (
        manifest.provider !==
        integrityIdentity.publisherId
      ) {
        throw new BadRequestException(
          'PLUGIN_PUBLICATION_PUBLISHER_MISMATCH',
        );
      }

      return await this.governance.submit({
        pluginId:
          manifest.id,
        pluginName:
          manifest.name,
        version:
          manifest.version,
        publisherId:
          integrityIdentity.publisherId,
        keyId:
          integrityIdentity.keyId,
        artifactStorageObjectId:
          input.storageObjectId,
        artifactSha256,
        integritySha256:
          this.sha256(
            integrityBytes,
          ),
        actorId:
          input.actorId,
        metadata:
          input.metadata,
      });
    } finally {
      if (extractedPath) {
        await rm(
          extractedPath,
          {
            recursive: true,
            force: true,
          },
        );
      }

      await rm(
        archivePath,
        {
          force: true,
        },
      );
    }
  }

  private assertPublicationUpload(
    storageObject: {
      originalName?: string;
      mimeType?: string;
      sizeBytes: number;
      checksum?: string;
      entityType?: string;
      metadata:
        Record<string, unknown>;
    },
  ): void {
    const acceptedMimeTypes =
      new Set([
        'application/zip',
        'application/x-zip-compressed',
      ]);

    if (
      storageObject.entityType !==
        'PLUGIN_PACKAGE'
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_ENTITY_TYPE_INVALID',
      );
    }

    if (
      storageObject.metadata
        ?.purpose !==
        'plugin-publication'
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_PURPOSE_INVALID',
      );
    }

    if (
      !storageObject.originalName
        ?.toLowerCase()
        .endsWith('.zip')
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_FILENAME_INVALID',
      );
    }

    if (
      !storageObject.mimeType ||
      !acceptedMimeTypes.has(
        storageObject.mimeType
          .toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_MIME_TYPE_INVALID',
      );
    }

    if (
      storageObject.sizeBytes <= 0 ||
      storageObject.sizeBytes >
        MAXIMUM_ARCHIVE_BYTES
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_SIZE_INVALID',
      );
    }

    if (
      !storageObject.checksum ||
      !SHA256_PATTERN.test(
        storageObject.checksum
          .toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_UPLOAD_CHECKSUM_INVALID',
      );
    }
  }

  private parseIntegrityIdentity(
    bytes: Buffer,
  ): IntegrityIdentity {
    let value: unknown;

    try {
      value =
        JSON.parse(
          bytes.toString('utf8'),
        );
    } catch {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_INTEGRITY_INVALID',
      );
    }

    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_INTEGRITY_INVALID',
      );
    }

    const item =
      value as Partial<
        IntegrityIdentity
      >;

    if (
      typeof item.publisherId !==
        'string' ||
      typeof item.keyId !==
        'string'
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_INTEGRITY_IDENTITY_INVALID',
      );
    }

    return {
      publisherId:
        item.publisherId,
      keyId:
        item.keyId,
    };
  }

  private sha256(
    value: Buffer,
  ): string {
    return createHash(
      'sha256',
    )
      .update(value)
      .digest('hex');
  }
}
