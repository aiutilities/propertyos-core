import { Injectable } from '@nestjs/common';
import {
  createHash,
  createPublicKey,
  verify as verifySignature,
} from 'crypto';
import {
  Dirent,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from 'fs';
import {
  join,
  relative,
  resolve,
  sep,
} from 'path';
import {
  PluginPublisherTrustService,
} from '../../trust/plugin-publisher-trust.service';
import {
  PluginSigningAlgorithm,
} from '../../trust/plugin-publisher-trust.types';

interface PluginIntegrityEntry {
  path: string;
  sha256: string;
  size: number;
}

interface PluginIntegrityManifest {
  schemaVersion: 1;
  publisherId: string;
  keyId: string;
  algorithm: PluginSigningAlgorithm;
  files: PluginIntegrityEntry[];
}

const INTEGRITY_FILE =
  'plugin.integrity.json';
const SIGNATURE_FILE =
  'plugin.signature';
const EMBEDDED_KEY_FILE =
  'signature.public.pem';
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;
const PACKAGE_PATH_PATTERN =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)[^\0]+$/;

@Injectable()
export class PluginSignatureVerifierService {
  constructor(
    private readonly publisherTrust:
      PluginPublisherTrustService,
  ) {}

  async verify(
    pluginRoot: string,
  ): Promise<string[]> {
    try {
      return await this.verifyPackage(
        pluginRoot,
      );
    } catch (error) {
      return [
        error instanceof Error
          ? error.message
          : 'Plugin signature verification failed',
      ];
    }
  }

  private async verifyPackage(
    pluginRoot: string,
  ): Promise<string[]> {
    const root = resolve(pluginRoot);
    const integrityPath =
      join(root, INTEGRITY_FILE);
    const signaturePath =
      join(root, SIGNATURE_FILE);
    const embeddedKeyPath =
      join(root, EMBEDDED_KEY_FILE);
    const errors: string[] = [];

    if (!existsSync(integrityPath)) {
      errors.push(
        `${INTEGRITY_FILE} is required`,
      );
    }

    if (!existsSync(signaturePath)) {
      errors.push(
        `${SIGNATURE_FILE} is required`,
      );
    }

    if (existsSync(embeddedKeyPath)) {
      errors.push(
        `${EMBEDDED_KEY_FILE} is forbidden; publisher keys must come from the trusted key registry`,
      );
    }

    if (errors.length > 0) {
      return errors;
    }

    this.assertRegularFile(
      integrityPath,
      INTEGRITY_FILE,
    );
    this.assertRegularFile(
      signaturePath,
      SIGNATURE_FILE,
    );

    const integrityBytes =
      readFileSync(integrityPath);
    const integrity =
      this.parseIntegrityManifest(
        integrityBytes,
      );

    const trustedKey =
      await this.publisherTrust.resolveActiveKey(
        integrity.publisherId,
        integrity.keyId,
        integrity.algorithm,
      );

    if (!trustedKey) {
      return [
        `Plugin publisher key is not trusted or active: ${integrity.publisherId}/${integrity.keyId}`,
      ];
    }

    const actualFingerprint =
      this.fingerprintPublicKey(
        trustedKey.publicKeyPem,
      );

    if (
      actualFingerprint !==
      trustedKey.fingerprintSha256.toLowerCase()
    ) {
      return [
        'Trusted publisher key fingerprint does not match its registry record',
      ];
    }

    const signature =
      readFileSync(signaturePath);

    if (signature.length === 0) {
      return [
        `${SIGNATURE_FILE} is empty`,
      ];
    }

    const signatureValid =
      verifySignature(
        'RSA-SHA256',
        integrityBytes,
        trustedKey.publicKeyPem,
        signature,
      );

    if (!signatureValid) {
      return [
        'Plugin digital signature verification failed',
      ];
    }

    return this.verifyFileInventory(
      root,
      integrity.files,
    );
  }

  private parseIntegrityManifest(
    bytes: Buffer,
  ): PluginIntegrityManifest {
    let value: unknown;

    try {
      value =
        JSON.parse(
          bytes.toString('utf8'),
        );
    } catch {
      throw new Error(
        `${INTEGRITY_FILE} is not valid JSON`,
      );
    }

    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      throw new Error(
        `${INTEGRITY_FILE} must be an object`,
      );
    }

    const item =
      value as Partial<
        PluginIntegrityManifest
      >;

    if (item.schemaVersion !== 1) {
      throw new Error(
        'Unsupported plugin integrity schema version',
      );
    }

    if (
      typeof item.publisherId !== 'string' ||
      typeof item.keyId !== 'string'
    ) {
      throw new Error(
        'Plugin integrity publisherId and keyId are required',
      );
    }

    if (
      item.algorithm !==
        'RSA-SHA256'
    ) {
      throw new Error(
        `Unsupported plugin signing algorithm: ${String(item.algorithm)}`,
      );
    }

    if (!Array.isArray(item.files)) {
      throw new Error(
        'Plugin integrity files must be an array',
      );
    }

    const paths = new Set<string>();
    let previousPath:
      string | undefined;

    for (const entry of item.files) {
      if (
        !entry ||
        typeof entry !== 'object'
      ) {
        throw new Error(
          'Plugin integrity file entry must be an object',
        );
      }

      const file =
        entry as Partial<
          PluginIntegrityEntry
        >;

      if (
        typeof file.path !== 'string' ||
        !this.isSafePackagePath(
          file.path,
        )
      ) {
        throw new Error(
          `Unsafe plugin integrity path: ${String(file.path)}`,
        );
      }

      if (
        file.path === INTEGRITY_FILE ||
        file.path === SIGNATURE_FILE ||
        file.path === EMBEDDED_KEY_FILE
      ) {
        throw new Error(
          `Plugin integrity inventory contains a reserved path: ${file.path}`,
        );
      }

      if (
        previousPath !== undefined &&
        this.comparePaths(
          previousPath,
          file.path,
        ) >= 0
      ) {
        throw new Error(
          'Plugin integrity file entries must be uniquely sorted by path',
        );
      }

      if (paths.has(file.path)) {
        throw new Error(
          `Duplicate plugin integrity path: ${file.path}`,
        );
      }

      if (
        typeof file.sha256 !== 'string' ||
        !SHA256_PATTERN.test(
          file.sha256,
        )
      ) {
        throw new Error(
          `Invalid SHA-256 for plugin file: ${file.path}`,
        );
      }

      if (
        typeof file.size !== 'number' ||
        !Number.isSafeInteger(
          file.size,
        ) ||
        file.size < 0
      ) {
        throw new Error(
          `Invalid size for plugin file: ${file.path}`,
        );
      }

      paths.add(file.path);
      previousPath =
        file.path;
    }

    if (!paths.has('plugin.json')) {
      throw new Error(
        'Plugin integrity inventory must include plugin.json',
      );
    }

    return item as PluginIntegrityManifest;
  }

  private verifyFileInventory(
    root: string,
    expectedFiles:
      PluginIntegrityEntry[],
  ): string[] {
    const actualPaths =
      this.collectPackageFiles(root)
        .filter(
          (path) =>
            path !== INTEGRITY_FILE &&
            path !== SIGNATURE_FILE,
        );

    const expectedPaths =
      expectedFiles.map(
        (entry) => entry.path,
      );

    const errors: string[] = [];
    const expectedSet =
      new Set(expectedPaths);
    const actualSet =
      new Set(actualPaths);

    for (const path of expectedPaths) {
      if (!actualSet.has(path)) {
        errors.push(
          `Signed plugin file is missing: ${path}`,
        );
      }
    }

    for (const path of actualPaths) {
      if (!expectedSet.has(path)) {
        errors.push(
          `Unsigned plugin file is present: ${path}`,
        );
      }
    }

    for (const entry of expectedFiles) {
      if (!actualSet.has(entry.path)) {
        continue;
      }

      const absolutePath =
        resolve(
          root,
          ...entry.path.split('/'),
        );

      if (
        absolutePath !== root &&
        !absolutePath.startsWith(
          `${root}${sep}`,
        )
      ) {
        errors.push(
          `Signed plugin file escapes package root: ${entry.path}`,
        );
        continue;
      }

      const data =
        readFileSync(absolutePath);

      if (data.length !== entry.size) {
        errors.push(
          `Signed plugin file size mismatch: ${entry.path}`,
        );
      }

      const digest =
        createHash('sha256')
          .update(data)
          .digest('hex');

      if (digest !== entry.sha256) {
        errors.push(
          `Signed plugin file checksum mismatch: ${entry.path}`,
        );
      }
    }

    return errors;
  }

  private collectPackageFiles(
    root: string,
  ): string[] {
    const files: string[] = [];

    const visit = (
      directory: string,
    ): void => {
      const entries =
        readdirSync(
          directory,
          {
            withFileTypes: true,
          },
        ).sort(
          (
            left: Dirent,
            right: Dirent,
          ) =>
            this.comparePaths(
              left.name,
              right.name,
            ),
        );

      for (const entry of entries) {
        const absolutePath =
          join(
            directory,
            entry.name,
          );
        const packagePath =
          relative(
            root,
            absolutePath,
          ).split(sep).join('/');

        if (
          entry.isSymbolicLink()
        ) {
          throw new Error(
            `Plugin package contains a symbolic link: ${packagePath}`,
          );
        }

        if (entry.isDirectory()) {
          visit(absolutePath);
          continue;
        }

        if (!entry.isFile()) {
          throw new Error(
            `Plugin package contains an unsupported filesystem entry: ${packagePath}`,
          );
        }

        if (
          !this.isSafePackagePath(
            packagePath,
          )
        ) {
          throw new Error(
            `Unsafe plugin package path: ${packagePath}`,
          );
        }

        files.push(packagePath);
      }
    };

    visit(root);

    return files.sort(
      (
        left,
        right,
      ) =>
        this.comparePaths(
          left,
          right,
        ),
    );
  }

  private assertRegularFile(
    path: string,
    label: string,
  ): void {
    const stats =
      lstatSync(path);

    if (
      stats.isSymbolicLink() ||
      !stats.isFile()
    ) {
      throw new Error(
        `${label} must be a regular file`,
      );
    }
  }

  private isSafePackagePath(
    path: string,
  ): boolean {
    return (
      path.length > 0 &&
      path.length <= 500 &&
      PACKAGE_PATH_PATTERN.test(path) &&
      !path.startsWith('./') &&
      !path.endsWith('/') &&
      !path.includes('//')
    );
  }

  private fingerprintPublicKey(
    publicKeyPem: string,
  ): string {
    const publicKey =
      createPublicKey(
        publicKeyPem,
      );
    const der =
      publicKey.export({
        type: 'spki',
        format: 'der',
      });

    return createHash('sha256')
      .update(der)
      .digest('hex');
  }

  private comparePaths(
    left: string,
    right: string,
  ): number {
    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }
}
