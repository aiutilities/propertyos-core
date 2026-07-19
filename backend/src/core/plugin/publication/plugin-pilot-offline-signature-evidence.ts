import {
  lstat,
  readFile,
  realpath,
} from 'fs/promises';
import {
  isAbsolute,
  relative,
  resolve,
} from 'path';
import {
  PilotOfflineSignatureEvidence,
  PilotOfflineSignatureEvidenceReader,
} from './plugin-pilot-rollout-adapter';
import {
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;
const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const PRIVATE_KEY_PATTERN =
  /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/;
const PRIVATE_FIELD_PATTERN =
  /^(?:private[_-]?key|signing[_-]?key|secret)$/i;

export class FilePilotOfflineSignatureEvidenceReader
  implements
    PilotOfflineSignatureEvidenceReader {
  constructor(
    private readonly evidencePath:
      string,
    private readonly repositoryRoot:
      string,
  ) {}

  async read(
    input: PluginPilotRolloutInput,
  ): Promise<
    PilotOfflineSignatureEvidence
  > {
    const path =
      await this.resolveEvidencePath();

    const bytes =
      await readFile(path);

    if (
      bytes.length === 0 ||
      bytes.length >
        1024 * 1024
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_SIZE_INVALID',
      );
    }

    const text =
      bytes.toString('utf8');

    if (
      PRIVATE_KEY_PATTERN.test(
        text,
      )
    ) {
      throw new Error(
        'PILOT_PRIVATE_KEY_MATERIAL_FORBIDDEN',
      );
    }

    let value: unknown;

    try {
      value = JSON.parse(text);
    } catch {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_JSON_INVALID',
      );
    }

    this.assertNoPrivateFields(
      value,
    );

    const evidence =
      this.parseEvidence(value);

    if (
      evidence.environmentId !==
        input.environmentId ||
      evidence.pluginId !==
        input.pluginId ||
      evidence.version !==
        input.version ||
      evidence.publisherId !==
        input.publisherId ||
      evidence.keyId !==
        input.keyId ||
      evidence
        .keyFingerprintSha256 !==
          input.keyFingerprintSha256 ||
      evidence.artifactSha256 !==
        input.artifactSha256 ||
      evidence.integritySha256 !==
        input.integritySha256
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_INPUT_MISMATCH',
      );
    }

    return evidence;
  }

  private async resolveEvidencePath():
    Promise<string> {
    if (
      !this.evidencePath.trim() ||
      !this.repositoryRoot.trim()
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_PATH_INVALID',
      );
    }

    const requested =
      resolve(this.evidencePath);
    const repository =
      await realpath(
        resolve(
          this.repositoryRoot,
        ),
      );
    const resolved =
      await realpath(requested);
    const repositoryRelative =
      relative(
        repository,
        resolved,
      );

    if (
      repositoryRelative === '' ||
      (
        !repositoryRelative
          .startsWith('..') &&
        !isAbsolute(
          repositoryRelative,
        )
      )
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_MUST_BE_OUTSIDE_REPOSITORY',
      );
    }

    const stats =
      await lstat(resolved);

    if (
      !stats.isFile() ||
      stats.isSymbolicLink()
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_FILE_INVALID',
      );
    }

    return resolved;
  }

  private parseEvidence(
    value: unknown,
  ): PilotOfflineSignatureEvidence {
    const record =
      this.record(value);

    const environmentId =
      this.requiredString(
        record.environmentId,
        'environmentId',
      );
    const pluginId =
      this.requiredIdentifier(
        record.pluginId,
        'pluginId',
      );
    const version =
      this.requiredString(
        record.version,
        'version',
      );
    const publisherId =
      this.requiredString(
        record.publisherId,
        'publisherId',
      );
    const keyId =
      this.requiredIdentifier(
        record.keyId,
        'keyId',
      );
    const verifierId =
      this.requiredIdentifier(
        record.verifierId,
        'verifierId',
      );
    const verifiedAt =
      this.requiredString(
        record.verifiedAt,
        'verifiedAt',
      );

    const keyFingerprintSha256 =
      this.requiredDigest(
        record
          .keyFingerprintSha256,
        'keyFingerprintSha256',
      );
    const artifactSha256 =
      this.requiredDigest(
        record.artifactSha256,
        'artifactSha256',
      );
    const integritySha256 =
      this.requiredDigest(
        record.integritySha256,
        'integritySha256',
      );

    if (
      publisherId !==
        'propertyos'
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_PUBLISHER_INVALID',
      );
    }

    if (
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(
        version,
      )
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_VERSION_INVALID',
      );
    }

    if (
      !Number.isFinite(
        Date.parse(verifiedAt),
      )
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_TIMESTAMP_INVALID',
      );
    }

    if (record.valid !== true) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_NOT_VALID',
      );
    }

    return {
      environmentId,
      pluginId,
      version,
      publisherId:
        'propertyos',
      keyId,
      keyFingerprintSha256,
      artifactSha256,
      integritySha256,
      verifiedAt,
      verifierId,
      valid: true,
    };
  }

  private assertNoPrivateFields(
    value: unknown,
    path = '$',
  ): void {
    if (
      value === null ||
      typeof value !== 'object'
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(
        (item, index) =>
          this.assertNoPrivateFields(
            item,
            `${path}[${index}]`,
          ),
      );
      return;
    }

    for (
      const [key, child]
      of Object.entries(
        value as
          Record<string, unknown>,
      )
    ) {
      if (
        PRIVATE_FIELD_PATTERN.test(
          key,
        )
      ) {
        throw new Error(
          `PILOT_PRIVATE_KEY_FIELD_FORBIDDEN:${path}.${key}`,
        );
      }

      if (
        typeof child ===
          'string' &&
        PRIVATE_KEY_PATTERN.test(
          child,
        )
      ) {
        throw new Error(
          'PILOT_PRIVATE_KEY_MATERIAL_FORBIDDEN',
        );
      }

      this.assertNoPrivateFields(
        child,
        `${path}.${key}`,
      );
    }
  }

  private record(
    value: unknown,
  ): Record<string, unknown> {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_OBJECT_REQUIRED',
      );
    }

    return value as
      Record<string, unknown>;
  }

  private requiredString(
    value: unknown,
    label: string,
  ): string {
    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {
      throw new Error(
        `PILOT_OFFLINE_SIGNATURE_EVIDENCE_${label.toUpperCase()}_INVALID`,
      );
    }

    return value.trim();
  }

  private requiredIdentifier(
    value: unknown,
    label: string,
  ): string {
    const item =
      this.requiredString(
        value,
        label,
      );

    if (
      !IDENTIFIER_PATTERN.test(
        item,
      )
    ) {
      throw new Error(
        `PILOT_OFFLINE_SIGNATURE_EVIDENCE_${label.toUpperCase()}_INVALID`,
      );
    }

    return item;
  }

  private requiredDigest(
    value: unknown,
    label: string,
  ): string {
    const item =
      this.requiredString(
        value,
        label,
      );

    if (
      !SHA256_PATTERN.test(
        item,
      )
    ) {
      throw new Error(
        `PILOT_OFFLINE_SIGNATURE_EVIDENCE_${label.toUpperCase()}_INVALID`,
      );
    }

    return item;
  }
}
