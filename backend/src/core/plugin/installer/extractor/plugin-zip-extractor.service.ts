import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  resolve,
  sep,
} from 'path';
import { randomUUID } from 'crypto';

export const PLUGIN_ARCHIVE_POLICY = Object.freeze({
  maximumArchiveBytes: 100 * 1024 * 1024,
  maximumEntries: 2048,
  maximumEntryBytes: 64 * 1024 * 1024,
  maximumExpandedBytes: 256 * 1024 * 1024,
  maximumCompressionRatio: 100,
});

@Injectable()
export class PluginZipExtractorService {
  extract(zipFile: string): string {
    this.assertArchiveFile(zipFile);

    const installationRoot = join(
      process.cwd(),
      'plugins',
      '.installed',
    );

    const output = join(
      installationRoot,
      `${basename(zipFile, extname(zipFile))}-${randomUUID()}`,
    );

    mkdirSync(installationRoot, { recursive: true });
    mkdirSync(output, { recursive: false });

    try {
      const zip = new AdmZip(zipFile);
      const entries = zip.getEntries();

      this.validateEntries(entries);

      for (const entry of entries) {
        const originalEntryName = this.getOriginalEntryName(entry);
        const relativePath = this.normalizeEntryName(originalEntryName);
        const targetPath = this.resolveTargetPath(output, relativePath);

        if (entry.isDirectory) {
          mkdirSync(targetPath, { recursive: true });
          continue;
        }

        mkdirSync(dirname(targetPath), { recursive: true });

        const content = entry.getData();

        if (content.length !== entry.header.size) {
          throw new Error(
            `Plugin archive entry size mismatch: ${entry.entryName}`,
          );
        }

        writeFileSync(targetPath, content, {
          flag: 'wx',
          mode: 0o600,
        });
      }

      return output;
    } catch (error) {
      rmSync(output, {
        recursive: true,
        force: true,
      });

      throw error;
    }
  }

  private assertArchiveFile(zipFile: string): void {
    if (!existsSync(zipFile)) {
      throw new Error(`Plugin package not found: ${zipFile}`);
    }

    const archive = statSync(zipFile);

    if (!archive.isFile()) {
      throw new Error(`Plugin package is not a regular file: ${zipFile}`);
    }

    if (archive.size > PLUGIN_ARCHIVE_POLICY.maximumArchiveBytes) {
      throw new Error(
        `Plugin archive exceeds maximum size of ${PLUGIN_ARCHIVE_POLICY.maximumArchiveBytes} bytes`,
      );
    }
  }

  private validateEntries(entries: AdmZip.IZipEntry[]): void {
    if (entries.length === 0) {
      throw new Error('Plugin archive is empty');
    }

    if (entries.length > PLUGIN_ARCHIVE_POLICY.maximumEntries) {
      throw new Error(
        `Plugin archive exceeds maximum entry count of ${PLUGIN_ARCHIVE_POLICY.maximumEntries}`,
      );
    }

    const normalizedPaths = new Set<string>();
    let expandedBytes = 0;

    for (const entry of entries) {
      const originalEntryName = this.getOriginalEntryName(entry);
      const relativePath = this.normalizeEntryName(originalEntryName);

      if (normalizedPaths.has(relativePath)) {
        throw new Error(
          `Plugin archive contains duplicate entry: ${relativePath}`,
        );
      }

      normalizedPaths.add(relativePath);
      this.assertRegularEntry(entry);

      if (entry.isDirectory) {
        continue;
      }

      const expandedSize = entry.header.size;
      const compressedSize = entry.header.compressedSize;

      if (expandedSize > PLUGIN_ARCHIVE_POLICY.maximumEntryBytes) {
        throw new Error(
          `Plugin archive entry exceeds maximum size: ${entry.entryName}`,
        );
      }

      expandedBytes += expandedSize;

      if (expandedBytes > PLUGIN_ARCHIVE_POLICY.maximumExpandedBytes) {
        throw new Error(
          `Plugin archive exceeds maximum expanded size of ${PLUGIN_ARCHIVE_POLICY.maximumExpandedBytes} bytes`,
        );
      }

      if (
        expandedSize > 0 &&
        (
          compressedSize === 0 ||
          expandedSize / compressedSize >
            PLUGIN_ARCHIVE_POLICY.maximumCompressionRatio
        )
      ) {
        throw new Error(
          `Plugin archive entry exceeds maximum compression ratio: ${entry.entryName}`,
        );
      }
    }
  }

  private getOriginalEntryName(entry: AdmZip.IZipEntry): string {
    const rawEntryName = entry.rawEntryName;

    if (!Buffer.isBuffer(rawEntryName) || rawEntryName.length === 0) {
      throw new Error('Plugin archive contains an invalid raw entry name');
    }

    if (rawEntryName.includes(0)) {
      throw new Error('Plugin archive entry name contains a null byte');
    }

    return rawEntryName.toString('utf8');
  }

  private normalizeEntryName(entryName: string): string {
    if (!entryName || entryName.includes('\0')) {
      throw new Error('Plugin archive contains an invalid entry name');
    }

    const normalized = entryName.replace(/\\/g, '/');

    if (
      isAbsolute(normalized) ||
      normalized.startsWith('/') ||
      normalized.startsWith('//') ||
      /^[A-Za-z]:\//.test(normalized)
    ) {
      throw new Error(
        `Plugin archive contains an absolute path: ${entryName}`,
      );
    }

    const parts = normalized
      .split('/')
      .filter((part) => part.length > 0 && part !== '.');

    if (parts.length === 0 || parts.some((part) => part === '..')) {
      throw new Error(
        `Plugin archive contains an unsafe path: ${entryName}`,
      );
    }

    return parts.join('/');
  }

  private resolveTargetPath(output: string, relativePath: string): string {
    const outputRoot = resolve(output);
    const targetPath = resolve(outputRoot, relativePath);

    if (
      targetPath !== outputRoot &&
      !targetPath.startsWith(`${outputRoot}${sep}`)
    ) {
      throw new Error(
        `Plugin archive entry escapes installation directory: ${relativePath}`,
      );
    }

    return targetPath;
  }

  private assertRegularEntry(entry: AdmZip.IZipEntry): void {
    const unixMode = (entry.attr >>> 16) & 0xffff;
    const fileType = unixMode & 0o170000;

    if (fileType === 0o120000) {
      throw new Error(
        `Plugin archive contains a symbolic link: ${entry.entryName}`,
      );
    }

    if (
      fileType !== 0 &&
      fileType !== 0o040000 &&
      fileType !== 0o100000
    ) {
      throw new Error(
        `Plugin archive contains an unsupported entry type: ${entry.entryName}`,
      );
    }
  }
}
